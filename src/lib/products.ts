import type { Prisma, Product } from "@/generated/prisma/client";
import type { Locale } from "@/i18n/config";
import { localName } from "@/lib/localize";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  oldPrice: number | null;
  imageUrl: string | null;
  stock: number;
  freeDelivery: boolean;
  sku: string | null;
  /** Logged-in buyer's own price (from their price list), when lower or different from the list price. */
  buyerPrice?: number | null;
};

export function toCard(p: Product, locale: Locale, buyerPrice?: number | null): ProductCardData {
  return {
    id: p.id,
    slug: p.slug,
    name: localName(p, locale),
    price: p.price,
    oldPrice: p.oldPrice,
    imageUrl: p.imageUrl,
    stock: p.stock,
    freeDelivery: p.freeDelivery,
    sku: p.sku,
    buyerPrice: buyerPrice && buyerPrice !== p.price ? buyerPrice : null,
  };
}

export type SortOption = "popular" | "newest" | "price_asc" | "price_desc";

export function parseSort(value: unknown): SortOption {
  return value === "newest" || value === "price_asc" || value === "price_desc" ? value : "popular";
}

export function sortToOrderBy(sort: SortOption): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ price: "asc" }];
    case "price_desc":
      return [{ price: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    default:
      // Featured first, then in-stock, then by name.
      return [{ isFeatured: "desc" }, { stock: "desc" }, { name: "asc" }];
  }
}

/** Search across all language fields and SKU (case-insensitive). */
export function searchWhere(q: string): Prisma.ProductWhereInput {
  const terms = q.trim().split(/\s+/).filter(Boolean).slice(0, 5);
  return {
    AND: terms.map((term) => ({
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { nameRu: { contains: term, mode: "insensitive" } },
        { nameEn: { contains: term, mode: "insensitive" } },
        { sku: { contains: term, mode: "insensitive" } },
        { compatibleWith: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { descriptionRu: { contains: term, mode: "insensitive" } },
      ],
    })),
  };
}

/** Model tokens of a machine used to find its spare parts: SKU plus model-like words from the name (e.g. "CBY-AC", "G65"). */
export function modelTokens(p: { sku: string | null; name: string }): string[] {
  const fromName = p.name.match(/[A-Za-z]{1,6}[-\s.]?\d[\w.\-/]*/g) ?? [];
  const tokens = [p.sku ?? "", ...fromName].map((x) => x.trim()).filter((x) => x.length >= 3);
  return [...new Set(tokens)].slice(0, 6);
}

/** Active spare parts whose "compatible with" list mentions one of the tokens. */
export function sparePartsWhere(tokens: string[]): Prisma.ProductWhereInput {
  return {
    isActive: true,
    category: { isSparePart: true },
    OR: tokens.map((tk) => ({ compatibleWith: { contains: tk, mode: "insensitive" as const } })),
  };
}
