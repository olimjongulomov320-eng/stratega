import type { Locale } from "@/i18n/config";

type Named = { name: string; nameRu?: string | null; nameEn?: string | null };
type Described = { description?: string | null; descriptionRu?: string | null; descriptionEn?: string | null };

/** Name in the page language, falling back to Uzbek. */
export function localName(item: Named, locale: Locale): string {
  if (locale === "ru") return item.nameRu?.trim() || item.name;
  if (locale === "en") return item.nameEn?.trim() || item.nameRu?.trim() || item.name;
  return item.name;
}

/** Description in the page language, falling back to Uzbek. */
export function localDescription(item: Described, locale: Locale): string {
  if (locale === "ru") return item.descriptionRu?.trim() || item.description || "";
  if (locale === "en") return item.descriptionEn?.trim() || item.descriptionRu?.trim() || item.description || "";
  return item.description || "";
}

/** Plain-text excerpt cut at a word boundary (for meta descriptions). */
export function excerpt(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : max).replace(/[,.;:—–-]+$/, "")}…`;
}
