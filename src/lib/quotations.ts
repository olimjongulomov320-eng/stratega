import type { QuotationStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { createOrder } from "@/lib/orders";
import { nextBusinessNumber } from "@/lib/numbers";

type TxClient = Prisma.TransactionClient;

// Hujjatlar (Quotation) — RFQ dan keyingi narx taklifi bosqichi.
// RFQ -> QUOTATION -> ORDER. Mijoz tasdiqlagach (ACCEPTED) buyurtmaga
// aylantiriladi.

export type QuotationItemInput = { productId: string; quantity: number; price: number };

export type CreateQuotationInput = {
  rfqRequestId?: string | null;
  customerId?: string | null;
  items: QuotationItemInput[];
  validUntil?: Date | null;
  note?: string | null;
};

export async function generateQuotationNumber(tx?: TxClient): Promise<string> {
  // Sequence'dan — `count() + 1` raqam takrorlanishiga va parallel
  // yaratishlarda dubl raqamga olib kelardi.
  return nextBusinessNumber("quotation", { prefix: "QUO" }, tx);
}

export async function createQuotation(
  input: CreateQuotationInput,
  actorId?: string | null
) {
  if (input.items.length === 0) {
    throw new Error("Taklifda kamida bitta mahsulot bo'lishi kerak.");
  }
  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Miqdor musbat butun son bo'lishi kerak.");
    }
    if (!Number.isFinite(item.price) || item.price < 0) {
      throw new Error("Narx noto'g'ri.");
    }
  }

  if (input.rfqRequestId) {
    const existing = await prisma.quotation.findUnique({
      where: { rfqRequestId: input.rfqRequestId },
    });
    if (existing) {
      throw new Error("Bu ariza uchun taklif allaqachon yaratilgan.");
    }
  }

  return prisma.$transaction(async (tx) => {
    const quotation = await tx.quotation.create({
      data: {
        number: await generateQuotationNumber(tx),
        rfqRequestId: input.rfqRequestId ?? null,
        customerId: input.customerId ?? null,
        validUntil: input.validUntil ?? null,
        note: input.note ?? null,
        status: "DRAFT",
        items: {
          create: input.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
          })),
        },
      },
      include: { items: true },
    });

    await writeAuditLog(
      {
        actorId,
        action: "quotation.create",
        entity: "Quotation",
        entityId: quotation.id,
        newData: { number: quotation.number, items: input.items.length },
      },
      tx
    );

    return quotation;
  });
}

const QUOTATION_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  DRAFT: ["SENT", "REJECTED"],
  SENT: ["ACCEPTED", "REJECTED", "EXPIRED"],
  ACCEPTED: [],
  REJECTED: ["DRAFT"],
  EXPIRED: ["DRAFT"],
};

export function allowedQuotationTransitions(status: QuotationStatus): QuotationStatus[] {
  return QUOTATION_TRANSITIONS[status] ?? [];
}

export async function updateQuotationStatus(
  quotationId: string,
  nextStatus: QuotationStatus,
  actorId?: string | null
) {
  await prisma.$transaction(async (tx) => {
    const quotation = await tx.quotation.findUniqueOrThrow({ where: { id: quotationId } });
    if (quotation.status === nextStatus) return;

    const allowed = QUOTATION_TRANSITIONS[quotation.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(
        `"${quotation.status}" holatidan "${nextStatus}" holatiga o'tib bo'lmaydi.`
      );
    }

    await tx.quotation.update({
      where: { id: quotationId },
      data: { status: nextStatus },
    });

    await writeAuditLog(
      {
        actorId,
        action: "quotation.status_change",
        entity: "Quotation",
        entityId: quotationId,
        oldData: { status: quotation.status },
        newData: { status: nextStatus },
      },
      tx
    );
  });
}

// Tasdiqlangan taklifdan buyurtma yaratish (idempotent).
export async function createOrderFromQuotation(
  quotationId: string,
  actorId?: string | null
): Promise<{ orderId: string }> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { items: true, order: true },
  });
  if (!quotation) throw new Error("Taklif topilmadi.");
  if (quotation.order) return { orderId: quotation.order.id };
  if (quotation.status !== "ACCEPTED") {
    throw new Error("Faqat tasdiqlangan (ACCEPTED) taklifdan buyurtma yaratiladi.");
  }

  const order = await createOrder(
    {
      customerId: quotation.customerId,
      note: `Taklif ${quotation.number} asosida`,
      items: quotation.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
      })),
    },
    actorId
  );

  await prisma.quotation.update({
    where: { id: quotationId },
    data: { order: { connect: { id: order.id } } },
  });

  return { orderId: order.id };
}

// Ariza (RFQ) uchun taklif yaratish — ariza predmetidagi narxlar asosida.
export async function createQuotationFromRfq(
  rfqRequestId: string,
  actorId?: string | null,
  options: { validUntil?: Date | null; note?: string | null } = {}
) {
  const rfq = await prisma.rfqRequest.findUnique({
    where: { id: rfqRequestId },
    include: { items: true, quotation: true },
  });
  if (!rfq) throw new Error("Ariza topilmadi.");
  if (rfq.quotation) return rfq.quotation;

  const customer = await prisma.customer.findFirst({
    where: { companyName: rfq.companyName },
    select: { id: true },
  });

  const quotation = await createQuotation(
    {
      rfqRequestId,
      customerId: customer?.id ?? null,
      items: rfq.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.priceAtQuote,
      })),
      validUntil: options.validUntil ?? null,
      note: options.note ?? rfq.comment ?? null,
    },
    actorId
  );

  if (rfq.status === "NEW" || rfq.status === "IN_REVIEW") {
    await prisma.rfqRequest.update({
      where: { id: rfqRequestId },
      data: { status: "QUOTED" },
    });
  }

  return quotation;
}
