import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { getMainWarehouseId } from "@/lib/warehouse";
import { generateOrderNumber } from "@/lib/orders";
import { nextBusinessNumber } from "@/lib/numbers";

/**
 * Tasdiqlangan arizani (RfqRequest) rasmiy Buyurtma (Order) hujjatiga
 * aylantiradi.
 *
 * MUHIM: RfqRequest CONFIRMED holatiga o'tganda requests/actions.ts allaqachon
 * jismoniy qoldiqni ORDER sababi bilan kamaytirgan. Shu sababli bu yerda
 * qayta zaxiralash yoki yana bir marta qoldiq kamaytirish YO'Q — aks holda
 * ikki marta hisobdan chiqadi.
 *
 * Lekin buyurtma "hujjatsiz" qolmasligi kerak: shuning uchun haqiqiy
 * Shipment yaratiladi (SHIPPED, stockAppliedAt to'ldirilgan) — jurnaldagi
 * chiqim izi buyurtma va jo'natma bilan bog'lanadi, va buyurtmaning
 * hayot sikli to'liq bo'ladi.
 */
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

    const existing = await tx.quotation.findUnique({
      where: { rfqRequestId },
      include: { order: true },
    });
    if (existing?.order) {
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
    const number = await generateOrderNumber(tx);

    const quotation = await tx.quotation.create({
      data: {
        number: await nextBusinessNumber("quotation", { prefix: "QUO" }, tx),
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
        stockDeductedAt: new Date(),
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

    // Haqiqiy jo'natma — buyurtmaning ombor qismi rasmiylashtiriladi.
    // Qoldiq allaqachon kamaygani uchun `stockAppliedAt` to'ldiriladi:
    // bu jo'natma qayta yozilmaydi.
    await tx.shipment.create({
      data: {
        number: await nextBusinessNumber("shipment", { prefix: "SHP" }, tx),
        orderId: order.id,
        warehouseId,
        responsibleId: actorId ?? null,
        status: "SHIPPED",
        shippedAt: new Date(),
        stockAppliedAt: new Date(),
        note: `Ariza ${rfq.id.slice(0, 8)} asosida`,
        items: {
          create: rfq.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
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
