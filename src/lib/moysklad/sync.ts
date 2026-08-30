import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  fetchAllAssortment,
  fetchStockReport,
  type MoySkladAssortmentItem,
} from "./client";
import { syncProductImage } from "./images";

const PROVIDER = "moysklad";
const UNCATEGORIZED_SLUG = "kategoriyasiz";
const DEFAULT_PRICE_TYPE_NAME = "Цена продажи";
const RUNNING_STALE_MS = 10 * 60 * 1000;

export type SyncResult = {
  ok: boolean;
  created: number;
  updated: number;
  hidden: number;
  skipped: number;
  error?: string;
  durationMs: number;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractPrice(
  item: MoySkladAssortmentItem,
  priceTypeName: string
): number | null {
  const prices = item.salePrices ?? [];
  const match =
    prices.find((p) => p.priceType.name === priceTypeName) ?? prices[0];
  if (!match) return null;
  return Math.round(match.value / 100);
}

async function getOrCreateUncategorizedCategory(): Promise<string> {
  const existing = await prisma.category.findUnique({
    where: { slug: UNCATEGORIZED_SLUG },
  });
  if (existing) return existing.id;

  const maxSortOrder = await prisma.category.aggregate({
    _max: { sortOrder: true },
  });

  const created = await prisma.category.create({
    data: {
      slug: UNCATEGORIZED_SLUG,
      name: "Kategoriyasiz (MoySklad)",
      sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
    },
  });
  return created.id;
}

export async function runMoySkladSync(): Promise<SyncResult> {
  const start = Date.now();

  const settings = await prisma.integrationSettings.findUnique({
    where: { provider: PROVIDER },
  });

  if (!settings || !settings.apiToken || !settings.isEnabled) {
    return {
      ok: false,
      created: 0,
      updated: 0,
      hidden: 0,
      skipped: 0,
      error: "MoySklad integratsiyasi sozlanmagan.",
      durationMs: Date.now() - start,
    };
  }

  if (
    settings.lastSyncStatus === "RUNNING" &&
    settings.updatedAt &&
    Date.now() - settings.updatedAt.getTime() < RUNNING_STALE_MS
  ) {
    return {
      ok: false,
      created: 0,
      updated: 0,
      hidden: 0,
      skipped: 0,
      error: "Sinxronizatsiya allaqachon ishlamoqda.",
      durationMs: Date.now() - start,
    };
  }

  const token = settings.apiToken;
  const priceTypeName = settings.priceTypeName || DEFAULT_PRICE_TYPE_NAME;

  await prisma.integrationSettings.update({
    where: { provider: PROVIDER },
    data: { lastSyncStatus: "RUNNING" },
  });

  let created = 0;
  let updated = 0;
  let hidden = 0;
  let skipped = 0;

  try {
    const [assortment, stockById] = await Promise.all([
      fetchAllAssortment(token),
      fetchStockReport(token),
    ]);

    const sellableItems = assortment.filter(
      (item) =>
        (item.meta.type === "product" || item.meta.type === "variant") &&
        !item.archived
    );

    const existingProducts = await prisma.product.findMany({
      where: { moySkladId: { not: null } },
      select: { id: true, moySkladId: true, moySkladUpdatedAt: true },
    });
    const existingByMoySkladId = new Map(
      existingProducts.map((p) => [p.moySkladId as string, p])
    );

    const seenMoySkladIds = new Set<string>();
    let uncategorizedId: string | null = null;

    for (const item of sellableItems) {
      seenMoySkladIds.add(item.id);
      const existing = existingByMoySkladId.get(item.id);

      const itemUpdatedAt = new Date(item.updated);
      if (
        existing?.moySkladUpdatedAt &&
        existing.moySkladUpdatedAt.getTime() >= itemUpdatedAt.getTime()
      ) {
        skipped += 1;
        continue;
      }

      const price = extractPrice(item, priceTypeName);
      const stock = stockById.has(item.id) ? stockById.get(item.id)! : null;

      let imageUrl: string | null = null;
      try {
        imageUrl = await syncProductImage(token, item);
      } catch (err) {
        console.error(
          `MoySklad: mahsulot rasmini yuklashda xatolik (${item.id}):`,
          err
        );
      }

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: item.name,
            ...(price !== null ? { price } : {}),
            ...(stock !== null ? { stock } : {}),
            ...(imageUrl !== null ? { imageUrl } : {}),
            moySkladCode: item.code ?? item.article ?? null,
            moySkladUpdatedAt: itemUpdatedAt,
            lastSyncedAt: new Date(),
          },
        });
        updated += 1;
      } else {
        if (!uncategorizedId) {
          uncategorizedId = await getOrCreateUncategorizedCategory();
        }

        let slug = slugify(item.name) || `mahsulot-${item.id.slice(0, 8)}`;
        const slugTaken = await prisma.product.findUnique({
          where: { slug },
        });
        if (slugTaken) slug = `${slug}-${item.id.slice(0, 8)}`;

        await prisma.product.create({
          data: {
            slug,
            name: item.name,
            description: "",
            price: price ?? 0,
            stock: stock ?? 0,
            imageUrl,
            categoryId: uncategorizedId,
            isActive: false,
            moySkladId: item.id,
            moySkladCode: item.code ?? item.article ?? null,
            moySkladUpdatedAt: itemUpdatedAt,
            lastSyncedAt: new Date(),
          },
        });
        created += 1;
      }
    }

    const removedIds = existingProducts
      .filter((p) => p.moySkladId && !seenMoySkladIds.has(p.moySkladId))
      .map((p) => p.id);

    if (removedIds.length > 0) {
      await prisma.product.updateMany({
        where: { id: { in: removedIds } },
        data: { isActive: false },
      });
      hidden = removedIds.length;
    }

    const summary = { created, updated, hidden, skipped, durationMs: Date.now() - start };

    await prisma.integrationSettings.update({
      where: { provider: PROVIDER },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: "SUCCESS",
        lastSyncError: null,
        lastSyncSummary: summary,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath("/admin/settings/moysklad");

    return { ok: true, ...summary };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.integrationSettings.update({
      where: { provider: PROVIDER },
      data: { lastSyncStatus: "ERROR", lastSyncError: message },
    });

    return {
      ok: false,
      created: 0,
      updated: 0,
      hidden: 0,
      skipped: 0,
      error: message,
      durationMs: Date.now() - start,
    };
  }
}
