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
  /** Price not confirmed: `price` is 0 and the site shows "price on request". */
  priceOnRequest: boolean;
  sku: string | null;
  brand: string | null;
  isBestseller: boolean;
  /** Logged-in buyer's own price (from their price list), when lower or different from the list price. */
  buyerPrice?: number | null;
};

export function toCard(p: Product, locale: Locale, buyerPrice?: number | null): ProductCardData {
  if (p.priceOnRequest) {
    return { ...toCard({ ...p, priceOnRequest: false }, locale), price: 0, oldPrice: null, buyerPrice: null, priceOnRequest: true };
  }
  return {
    id: p.id,
    slug: p.slug,
    name: localName(p, locale),
    price: p.price,
    oldPrice: p.oldPrice,
    imageUrl: p.imageUrl,
    stock: p.stock,
    freeDelivery: p.freeDelivery,
    priceOnRequest: false,
    sku: p.sku,
    brand: p.brand,
    isBestseller: p.isBestseller,
    buyerPrice: buyerPrice && buyerPrice !== p.price ? buyerPrice : null,
  };
}

export type SortOption = "popular" | "newest" | "price_asc" | "price_desc";

export function parseSort(value: unknown): SortOption {
  return value === "newest" || value === "price_asc" || value === "price_desc" ? value : "popular";
}

export function sortToOrderBy(sort: SortOption): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    // "Price on request" items have no real price, so they go after the priced ones.
    case "price_asc":
      return [{ priceOnRequest: "asc" }, { price: "asc" }];
    case "price_desc":
      return [{ priceOnRequest: "asc" }, { price: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    default:
      // Featured first, then priced items, then items with a photo (no photo = last), then in-stock, then by name.
      return [{ isFeatured: "desc" }, { isBestseller: "desc" }, { priceOnRequest: "asc" }, { imageUrl: { sort: "asc", nulls: "last" } }, { stock: "desc" }, { name: "asc" }];
  }
}

/** Search across all language fields and SKU (case-insensitive). */
// Cyrillic (Russian and Uzbek) → Uzbek Latin, so "штабелер" also finds "shtabeler".
const CYR_TO_LAT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "", э: "e", ю: "yu",
  я: "ya", ў: "o'", қ: "q", ғ: "g'", ҳ: "h",
};
const transliterate = (t: string) => [...t.toLowerCase()].map((c) => CYR_TO_LAT[c] ?? c).join("");

// Word stems buyers use for the same product type in Russian, Uzbek and English.
const SYNONYMS: string[][] = [
  ["рохл", "рокл", "rohly", "rohl", "транспалет", "гидравлическая тележ", "gidravlik telejka", "pallet truck"],
  ["штабел", "shtabel", "stacker"],
  ["строп", "strop", "sling"],
  ["подъемник", "подъёмник", "ko'targich", "kotargich", "lift"],
  ["шиномонтаж", "shinomontaj", "tyre changer"],
  ["балансир", "balansir", "balancer"],
  ["развал", "razval", "aligner"],
  ["генератор", "generator"],
  ["компрессор", "kompressor", "compressor"],
  ["поломоеч", "pol yuvish", "scrubber"],
  ["мойк", "yuvish apparat", "pressure washer"],
  ["пнд", "pnd", "полиэтилен", "polietilen"],
  ["погрузчик", "pogruzchik", "yuk ortgich", "forklift"],
  ["культиватор", "kultivator", "cultivator"],
  ["мотоблок", "motoblok"],
  ["кондиционер", "konditsioner"],
  ["стапел", "stapel"],
];

/** Spellings of one search word: as typed, transliterated, without "ё", and its synonyms. */
export function searchVariants(term: string): string[] {
  const lower = term.toLowerCase();
  const out = new Set([term, transliterate(term), lower.replace(/ё/g, "е")]);
  for (const group of SYNONYMS) {
    if (group.some((stem) => lower.includes(stem) || (stem.length >= 4 && stem.startsWith(lower) && lower.length >= 4))) group.forEach((stem) => out.add(stem));
  }
  return [...out].filter((v) => v.length >= 2).slice(0, 10);
}

export function searchWhere(q: string): Prisma.ProductWhereInput {
  const terms = q.trim().split(/\s+/).filter(Boolean).slice(0, 5);
  return {
    AND: terms.map((term) => ({
      OR: searchVariants(term).flatMap((v) => [
        { name: { contains: v, mode: "insensitive" as const } },
        { nameRu: { contains: v, mode: "insensitive" as const } },
        { nameEn: { contains: v, mode: "insensitive" as const } },
        { sku: { contains: v, mode: "insensitive" as const } },
        { compatibleWith: { contains: v, mode: "insensitive" as const } },
        { description: { contains: v, mode: "insensitive" as const } },
        { descriptionRu: { contains: v, mode: "insensitive" as const } },
      ]),
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
