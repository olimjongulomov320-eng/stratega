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

// The paragraph in a description that lists specs, e.g. "Характеристики: Вес: 440 кг; Питание: 380 V ±10%, 50 Hz."
const SPEC_PARAGRAPH = /^(?:Texnik xususiyatlari|Характеристики|Technical specifications|Specifications)\s*:\s*(.+)$/im;

/** "Label: value; Label: value." pairs from a description's spec paragraph; nothing when it has none. */
export function descriptionSpecs(description: string | null | undefined): { name: string; value: string }[] {
  const match = description?.match(SPEC_PARAGRAPH);
  if (!match) return [];
  const specs: { name: string; value: string }[] = [];
  for (const part of match[1].replace(/\.\s*$/, "").split(";")) {
    const colon = part.indexOf(":");
    if (colon < 1) continue;
    const name = part.slice(0, colon).trim();
    const value = part.slice(colon + 1).trim();
    if (name && value && name.length <= 60 && value.length <= 160) specs.push({ name, value });
  }
  return specs;
}

/**
 * Key facts of a product for structured data and /llms.txt: filter fields first, then the spec table, then the
 * spec paragraph of the description (most products keep their specs there).
 */
export function productFacts(p: SeoProduct, locale: Locale, max = 20, description?: string | null): { name: string; value: string }[] {
  const facts: { name: string; value: string }[] = [];
  const known = (name: string) => facts.some((f) => f.name.toLowerCase() === name.toLowerCase());
  for (const sf of SPEC_FILTERS) {
    const value = p[sf.field];
    if (value !== null && value !== undefined) facts.push({ name: sf.label[locale], value: `${value} ${sf.unit[locale]}` });
  }
  for (const row of parseSpecRows(p.specs)) {
    const name = specLabel(row, locale);
    if (name && row.value && !known(name)) facts.push({ name, value: row.value });
  }
  for (const spec of descriptionSpecs(description)) if (!known(spec.name)) facts.push(spec);
  return facts.slice(0, max);
}
