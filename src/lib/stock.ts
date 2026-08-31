import type { Prisma, StockMoveReason } from "@/generated/prisma/client";

type TxClient = Prisma.TransactionClient;

export async function recordStockChange(
  tx: TxClient,
  params: {
    productId: string;
    change: number; // musbat — kirim, manfiy — chiqim
    reason: StockMoveReason;
    note?: string | null;
    requestId?: string | null;
  }
): Promise<{ stockAfter: number }> {
  const product = await tx.product.update({
    where: { id: params.productId },
    data: { stock: { increment: params.change } },
    select: { stock: true, isActive: true },
  });

  await tx.stockMove.create({
    data: {
      productId: params.productId,
      change: params.change,
      stockAfter: product.stock,
      reason: params.reason,
      note: params.note ?? null,
      requestId: params.requestId ?? null,
    },
  });

  // Qoldiq 0 yoki undan kam bo'lsa, mahsulotni avtomatik yashiramiz.
  // Faqat yashirish uchun ishlaydi — qoldiq qayta to'lganda avtomatik
  // ko'rsatilmaydi, chunki admin uni boshqa sababga ko'ra yashirgan bo'lishi mumkin.
  if (product.stock <= 0 && product.isActive) {
    await tx.product.update({
      where: { id: params.productId },
      data: { isActive: false },
    });
  }

  return { stockAfter: product.stock };
}
