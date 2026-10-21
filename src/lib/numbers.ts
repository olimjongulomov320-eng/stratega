import type { Prisma } from "@/generated/prisma/client";

type TxClient = Prisma.TransactionClient;

/**
 * Biznes raqamlari sequence'dan olinadi.
 *
 * Avval raqam `count() + 1` dan hisoblanardi. Bu ikki muammoni keltiradi:
 *   1) yozuv o'chirilsa, raqam qayta ishlatilardi (ikki xil buyurtma
 *      bir xil raqam bilan chiqishi mumkin);
 *   2) parallel so'rovlarda ikkalasi bir xil raqamni olib, P2002 xatosi
 *      bilan dubl yaratishga urinishdi.
 *
 * Sequence'lar transaction'ga bog'liq emas — rollback bo'lsa ham raqam
 * "yo'qoladi" (bo'sh joy qoladi), lekin hech qachon takrorlanmaydi.
 * Bu professional tizimlar uchun standart yondashuv.
 */
const SEQUENCES = {
  order: { seq: "order_number_seq", prefix: "ORD" },
  stockDocument: { seq: "stock_document_seq", prefix: null }, // prefix turga qarab
  shipment: { seq: "shipment_number_seq", prefix: "SHP" },
  quotation: { seq: "quotation_number_seq", prefix: "QUO" },
} as const;

export type NumberKind = keyof typeof SEQUENCES;

export async function nextBusinessNumber(
  kind: NumberKind,
  options: { prefix?: string; width?: number } = {},
  tx?: TxClient
): Promise<string> {
  const client = tx ?? (await import("@/lib/prisma")).prisma;
  const config = SEQUENCES[kind];
  const prefix = options.prefix ?? config.prefix ?? "DOC";
  const width = options.width ?? 6;

  const rows = await client.$queryRaw<{ nextval: bigint }[]>`
    SELECT nextval(${config.seq}) AS nextval
  `;
  const value = Number(rows[0]?.nextval ?? 1);
  return `${prefix}-${String(value).padStart(width, "0")}`;
}
