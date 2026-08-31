import { prisma } from "@/lib/prisma";
import { recordStockChange } from "@/lib/stock";

const EXPECTED_HEADER = ["slug", "narx", "ombordagi_soni"];

export type ImportRowResult =
  | { status: "updated"; slug: string; stillHidden: boolean }
  | { status: "skipped"; slug: string; reason: string };

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim()));
}

export async function applyStockImport(csvText: string): Promise<{
  updated: ImportRowResult[];
  skipped: ImportRowResult[];
  error?: string;
}> {
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return { updated: [], skipped: [], error: "Fayl bo'sh." };
  }

  const [header, ...dataRows] = rows;
  const normalizedHeader = header.map((h) => h.toLowerCase());
  const isValidHeader = EXPECTED_HEADER.every((col, i) => normalizedHeader[i] === col);
  if (!isValidHeader) {
    return {
      updated: [],
      skipped: [],
      error: `Sarlavha noto'g'ri. Kutilgan: ${EXPECTED_HEADER.join(",")}`,
    };
  }

  const results: ImportRowResult[] = [];

  for (const row of dataRows) {
    const [slug, narxRaw, stockRaw] = row;
    if (!slug) continue;

    try {
      await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { slug } });
        if (!product) {
          results.push({
            status: "skipped",
            slug,
            reason: "Mahsulot topilmadi (slug mos kelmadi)",
          });
          return;
        }

        const newPrice = narxRaw ? Number(narxRaw) : null;
        const newStock = stockRaw ? Number(stockRaw) : null;

        if (
          newPrice !== null &&
          Number.isFinite(newPrice) &&
          newPrice !== product.price
        ) {
          await tx.product.update({
            where: { id: product.id },
            data: { price: newPrice },
          });
          await tx.priceHistory.create({
            data: {
              productId: product.id,
              oldPrice: product.price,
              newPrice,
            },
          });
        }

        if (newStock !== null && Number.isFinite(newStock)) {
          const delta = newStock - product.stock;
          if (delta !== 0) {
            await recordStockChange(tx, {
              productId: product.id,
              change: delta,
              reason: "IMPORT",
              note: "CSV import",
            });
          }
        }

        const updatedProduct = await tx.product.findUniqueOrThrow({
          where: { id: product.id },
          select: { isActive: true },
        });

        results.push({
          status: "updated",
          slug,
          stillHidden: !updatedProduct.isActive,
        });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ status: "skipped", slug, reason: message });
    }
  }

  return {
    updated: results.filter((r) => r.status === "updated"),
    skipped: results.filter((r) => r.status === "skipped"),
  };
}
