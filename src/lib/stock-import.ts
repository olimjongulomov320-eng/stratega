import { prisma } from "@/lib/prisma";
import { recordStockChange } from "@/lib/stock";
import { writeAuditLog, actorContext } from "@/lib/audit";
import { parseCsv } from "@/lib/csv";

const EXPECTED_HEADER = ["slug", "narx", "ombordagi_soni"];

export type ImportRowResult =
  | { status: "updated"; slug: string; stillHidden: boolean }
  | { status: "skipped"; slug: string; reason: string };

// Importdan OLDIN faylni tahlil qilish: qatorlar tekshiriladi, hech narsa
// o'zgartirilmaydi. UI foydalanuvchiga natijani ko'rsatadi va tasdiq so'raydi.
export type PlannedRow = {
  row: number; // CSV'dagi qator raqami (sarlavhadan keyin)
  slug: string;
  action: "update" | "skip";
  reason?: string;
  changes: { field: string; from: string | number; to: string | number }[];
};

export type ImportPreview = {
  error?: string;
  rows: PlannedRow[];
  toUpdate: number;
  toSkip: number;
};

async function planRows(csvText: string): Promise<ImportPreview> {
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return { rows: [], toUpdate: 0, toSkip: 0, error: "Fayl bo'sh." };
  }

  const [header, ...dataRows] = rows;
  const normalizedHeader = header.map((h) => h.toLowerCase());
  const isValidHeader = EXPECTED_HEADER.every((col, i) => normalizedHeader[i] === col);
  if (!isValidHeader) {
    return {
      rows: [],
      toUpdate: 0,
      toSkip: 0,
      error: `Sarlavha noto'g'ri. Kutilgan: ${EXPECTED_HEADER.join(",")}`,
    };
  }

  const planned: PlannedRow[] = [];
  let rowNumber = 1;

  for (const row of dataRows) {
    const [slug, narxRaw, stockRaw] = row;
    rowNumber++;
    if (!slug) continue;

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, price: true, stock: true },
    });

    if (!product) {
      planned.push({
        row: rowNumber,
        slug,
        action: "skip",
        reason: "Mahsulot topilmadi (slug mos kelmadi)",
        changes: [],
      });
      continue;
    }

    const changes: PlannedRow["changes"] = [];

    if (narxRaw) {
      const newPrice = Number(narxRaw);
      if (!Number.isFinite(newPrice) || newPrice < 0) {
        planned.push({ row: rowNumber, slug, action: "skip", reason: `Narx noto'g'ri: "${narxRaw}"`, changes: [] });
        continue;
      }
      if (newPrice !== product.price) {
        changes.push({ field: "Narx", from: product.price, to: newPrice });
      }
    }

    if (stockRaw) {
      const newStock = Number(stockRaw);
      if (!Number.isFinite(newStock) || !Number.isInteger(newStock) || newStock < 0) {
        planned.push({ row: rowNumber, slug, action: "skip", reason: `Qoldiq noto'g'ri: "${stockRaw}"`, changes: [] });
        continue;
      }
      if (newStock !== product.stock) {
        changes.push({ field: "Qoldiq", from: product.stock, to: newStock });
      }
    }

    if (changes.length === 0) {
      planned.push({ row: rowNumber, slug, action: "skip", reason: "O'zgarish yo'q", changes: [] });
      continue;
    }

    planned.push({ row: rowNumber, slug, action: "update", changes });
  }

  return {
    rows: planned,
    toUpdate: planned.filter((r) => r.action === "update").length,
    toSkip: planned.filter((r) => r.action === "skip").length,
  };
}

export async function previewStockImport(csvText: string): Promise<ImportPreview> {
  return planRows(csvText);
}

export async function applyStockImport(
  csvText: string,
  options: { preview?: ImportPreview } = {}
): Promise<{
  updated: ImportRowResult[];
  skipped: ImportRowResult[];
  error?: string;
}> {
  // Avval rejalashtirish (validatsiya) — xatolikli qatorlar hech qachon
  // jim yozilmaydi.
  const plan = options.preview ?? (await planRows(csvText));
  if (plan.error) {
    return { updated: [], skipped: [], error: plan.error };
  }

  const actor = await actorContext();
  const results: ImportRowResult[] = [];

  for (const planned of plan.rows.filter((r) => r.action === "update")) {
    const [slug] = [planned.slug];
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

        const priceChange = planned.changes.find((c) => c.field === "Narx");
        const stockChange = planned.changes.find((c) => c.field === "Qoldiq");

        if (priceChange) {
          const newPrice = Number(priceChange.to);
          await tx.product.update({
            where: { id: product.id },
            data: { price: newPrice },
          });
          await tx.priceHistory.create({
            data: {
              productId: product.id,
              oldPrice: product.price,
              newPrice,
              changedBy: actor.actorId ?? "csv-import",
              reason: "CSV import (narx)",
            },
          });
        }

        if (stockChange) {
          const newStock = Number(stockChange.to);
          const delta = newStock - product.stock;
          if (delta !== 0) {
            await recordStockChange(tx, {
              productId: product.id,
              change: delta,
              reason: "IMPORT",
              note: "CSV import",
              createdBy: actor.actorId,
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

  // Import jurnali — muhim admin amali.
  await writeAuditLog({
    ...actor,
    action: "import.products",
    entity: "Product",
    entityId: "csv",
    newData: {
      updated: results.filter((r) => r.status === "updated").length,
      skipped: results.filter((r) => r.status === "skipped").length,
    },
  });

  return {
    updated: results.filter((r) => r.status === "updated"),
    skipped: results.filter((r) => r.status === "skipped"),
  };
}
