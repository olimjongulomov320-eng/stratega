import { LOCALES, type Locale } from "@/i18n/config";
import { SPEC_FILTERS, parseSpecRows, specLabel } from "@/lib/product-specs";
import { formatNumber } from "@/lib/format";

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

type MetaProduct = {
  name: string;
  price: number;
  priceOnRequest: boolean;
  stock: number;
  sourcing?: "OWN_STOCK" | "SUPPLIER_STOCK" | null;
  leadTimeDays?: number | null;
};

const META_TEXT: Record<Locale, { price: (p: string) => string; onRequest: string; inStock: string; available: string; lead: (n: number) => string; toOrder: string }> = {
  uz: { price: (p) => `Narxi ${p} so'm (QQS bilan)`, onRequest: "Narxi so'rov bo'yicha", inStock: "Toshkentdagi omborda mavjud", available: "Mavjud", lead: (n) => `Buyurtma asosida, ~${n} kun`, toOrder: "Buyurtma asosida" },
  ru: { price: (p) => `Цена ${p} сум с НДС`, onRequest: "Цена по запросу", inStock: "В наличии на складе в Ташкенте", available: "В наличии", lead: (n) => `Под заказ, ~${n} дн.`, toOrder: "Под заказ" },
  en: { price: (p) => `Price ${p} UZS incl. VAT`, onRequest: "Price on request", inStock: "In stock in Tashkent", available: "Available", lead: (n) => `To order, ~${n} days`, toOrder: "To order" },
};

/**
 * Meta description for a product page: price and availability first (what search snippets and AI answers quote),
 * then the description without the product name it usually repeats. Same facts as the page shows, nothing added.
 */
export function productMetaDescription(p: MetaProduct, locale: Locale, name: string, description: string, max = 160): string {
  const t = META_TEXT[locale];
  const price = p.priceOnRequest || p.price <= 0 ? t.onRequest : t.price(formatNumber(p.price).replace(/\u00a0/g, " "));
  const stock =
    p.sourcing === "SUPPLIER_STOCK" ? t.available : p.stock > 0 ? t.inStock : p.leadTimeDays ? t.lead(p.leadTimeDays) : t.toOrder;
  const head = `${name}. ${price}. ${stock}.`;
  const body = description.replace(/\s+/g, " ").trim();
  const rest = body.startsWith(name) ? body.slice(name.length).replace(/^[\s.,:;—–-]+/, "") : body;
  if (!rest || head.length >= max - 20) return head;
  const room = max - head.length - 1;
  if (rest.length <= room) return `${head} ${rest}`;
  const cut = rest.slice(0, room - 1);
  const space = cut.lastIndexOf(" ");
  return `${head} ${cut.slice(0, space > 20 ? space : cut.length).replace(/[,.;:—–-]+$/, "")}…`;
}
