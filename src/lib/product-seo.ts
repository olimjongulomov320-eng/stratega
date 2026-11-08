import { LOCALES, type Locale } from "@/i18n/config";
import { SPEC_FILTERS, parseSpecRows, specLabel } from "@/lib/product-specs";

type SeoProduct = {
  nameRu?: string | null;
  nameEn?: string | null;
  specs?: unknown;
  capacityKg?: number | null;
  liftHeightMm?: number | null;
  workingWidthMm?: number | null;
  powerKw?: number | null;
};

/**
 * Languages a product really has text in. Uzbek always; Russian and English only when a name was entered,
 * so search engines and AI assistants are never shown Russian text presented as English.
 */
export function productLocales(p: SeoProduct): Locale[] {
  return LOCALES.filter((l) => l === "uz" || (l === "ru" ? !!p.nameRu?.trim() : !!p.nameEn?.trim()));
}

/** Key facts of a product (filter fields first, then the spec table) for structured data and /llms.txt. */
export function productFacts(p: SeoProduct, locale: Locale, max = 20): { name: string; value: string }[] {
  const facts: { name: string; value: string }[] = [];
  for (const sf of SPEC_FILTERS) {
    const value = p[sf.field];
    if (value !== null && value !== undefined) facts.push({ name: sf.label[locale], value: `${value} ${sf.unit[locale]}` });
  }
  for (const row of parseSpecRows(p.specs)) {
    const name = specLabel(row, locale);
    if (name && row.value && !facts.some((f) => f.name === name)) facts.push({ name, value: row.value });
  }
  return facts.slice(0, max);
}
