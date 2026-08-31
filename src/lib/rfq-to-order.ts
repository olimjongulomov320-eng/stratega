import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { getMainWarehouseId } from "@/lib/warehouse";
import { generateOrderNumber } from "@/lib/orders";

// Tasdiqlangan arizani (RfqRequest) rasmiy Buyurtma (Order) hujjatiga
// aylantiradi. MUHIM: RfqRequest CONFIRMED holatiga o'tganda
// requests/actions.ts allaqachon jismoniy qoldiqni ORDER sababi bilan
// kamaytirgan — shuning uchun bu yerda QAYTA zaxiralash yoki yana bir
// marta qoldiq kamaytirish YO'Q, aks holda ikki marta hisobdan chiqadi.
// Order shunchaki SHIPPED holatida yaratiladi (chunki qoldiq allaqachon
// jismoniy ravishda kamaygan) — buyurtma hujjatlari va hisobotlar
// (foyda, tarix) uchun rasmiylashtirish.
export async function convertRfqToOrder(
  rfqRequestId: string,
  actorId?: string | null
) {
  return prisma.$transaction(async (tx) => {
    const rfq = await tx.rfqRequest.findUniqueOrThrow({
      where: { id: rfqRequestId },
      include: { items: { include: { product: true } }, user: true },
    });

    if (rfq.status !== "CONFIRMED") {
      throw new Error(
        "Faqat tasdiqlangan (CONFIRMED) arizalarni buyurtmaga aylantirish mumkin."
      );
    }

    const existingOrder = await tx.quotation.findUnique({
      where: { rfqRequestId },
      include: { order: true },
    });
    if (existingOrder?.order) {
      throw new Error("Bu ariza allaqachon buyurtmaga aylantirilgan.");
    }

    let customerId: string | null = null;
    if (rfq.companyName) {
      const existingCustomer = await tx.customer.findFirst({
        where: { companyName: rfq.companyName },
      });
      customerId =
        existingCustomer?.id ??
        (
          await tx.customer.create({
            data: {
              companyName: rfq.companyName,
              contactName: rfq.contactName,
              phone: rfq.phone,
            },
          })
        ).id;
    }

    const warehouseId = await getMainWarehouseId(tx);
    const number = await generateOrderNumber();

    const quotation = await tx.quotation.create({
      data: {
        number: `QUO-${number.split("-")[1]}`,
        rfqRequestId,
        customerId,
        status: "ACCEPTED",
        items: {
          create: rfq.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.priceAtQuote,
          })),
        },
      },
    });

    const order = await tx.order.create({
      data: {
        number,
        customerId,
        warehouseId,
        quotationId: quotation.id,
        status: "SHIPPED", // qoldiq allaqachon RFQ tasdiqlanganda kamaygan
        note: `Ariza #${rfq.id.slice(0, 8)} asosida avtomatik yaratildi`,
        items: {
          create: rfq.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.priceAtQuote,
            costPrice: item.product.costPrice,
          })),
        },
      },
    });

    await writeAuditLog(
      {
        actorId,
        action: "order.create_from_rfq",
        entity: "Order",
        entityId: order.id,
        newData: { number: order.number, rfqRequestId },
      },
      tx
    );

    return order;
  });
}
