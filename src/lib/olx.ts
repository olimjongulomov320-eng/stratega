import "server-only";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";
import { COMPANY } from "@/lib/site";
import { isAvailable } from "@/lib/sourcing";

/**
 * OLX export: turns active catalogue products into OLX-ready adverts.
 * Used by the admin download (XLSX / CSV) and by the auto-updating XML feed.
 * OLX limits: title ≤ 70 characters, description 80–9000 characters, ≤ 8 photos.
 */
export type OlxSettings = {
  lang: "uz" | "ru";
  city: string;
  contactName: string;
  phone: string;
  onlyInStock: boolean;
  feedKey: string;
};

const KEY = "olx.settings";

export async function getOlxSettings(): Promise<OlxSettings> {
  const row = await prisma.setting.findUnique({ where: { key: KEY } });
  const v = (row?.value ?? {}) as Partial<OlxSettings>;
  const settings: OlxSettings = {
    lang: v.lang === "uz" ? "uz" : "ru",
    city: v.city ?? "Ташкент",
    contactName: v.contactName ?? COMPANY.brand,
    phone: v.phone ?? COMPANY.phone,
    onlyInStock: v.onlyInStock ?? false,
    feedKey: v.feedKey ?? "",
  };
  if (!settings.feedKey) {
    settings.feedKey = randomBytes(16).toString("hex");
    await saveOlxSettings(settings);
  }
  return settings;
}

export async function saveOlxSettings(s: OlxSettings) {
  await prisma.setting.upsert({ where: { key: KEY }, create: { key: KEY, value: s }, update: { value: s } });
}

export type OlxRow = {
  externalId: string;
  title: string;
  description: string;
  price: number;
  currency: "UZS";
  condition: string;
  category: string;
  brand: string;
  model: string;
  images: string[];
  url: string;
  stock: number;
  available: boolean;
  city: string;
  contactName: string;
  phone: string;
};

export type OlxSkip = { name: string; reason: string };

const TEXT = {
  uz: { condition: "Yangi", tail: "Yangi, rasmiy kafolat bilan. Yuridik shaxslar uchun QQS bilan hisob-faktura va shartnoma. O'zbekiston bo'ylab yetkazib berish." },
  ru: { condition: "Новый", tail: "Новый, с официальной гарантией. Для юрлиц — счёт-фактура с НДС и договор. Доставка по всему Узбекистану." },
};

function cutTitle(s: string, max = 70): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return (sp > 40 ? cut.slice(0, sp) : cut).replace(/[\s,.;:—-]+$/, "");
}

/** OLX rejects links and contact details inside the text; we keep plain product information only. */
function cleanDescription(s: string): string {
  return s
    .replace(/https?:\/\/\S+/g, "")
    .replace(/(\+?998[\s\d()-]{7,})/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function buildOlxRows(settings: OlxSettings): Promise<{ rows: OlxRow[]; skipped: OlxSkip[] }> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });
  const t = TEXT[settings.lang];
  const rows: OlxRow[] = [];
  const skipped: OlxSkip[] = [];
  for (const p of products) {
    const name = settings.lang === "ru" ? p.nameRu || p.name : p.name;
    const images = [p.imageUrl, ...p.images].filter((x): x is string => Boolean(x)).slice(0, 8).map((u) => (u.startsWith("http") ? u : absoluteUrl(u)));
    if (p.price <= 0 || p.priceOnRequest) { skipped.push({ name, reason: "narx yo'q" }); continue; }
    if (images.length === 0) { skipped.push({ name, reason: "rasm yo'q" }); continue; }
    if (settings.onlyInStock && !isAvailable(p)) { skipped.push({ name, reason: "omborda yo'q" }); continue; }
    const base = cleanDescription((settings.lang === "ru" ? p.descriptionRu || p.description : p.description) || "");
    let description = base.includes(t.tail) ? base : [base, t.tail].filter(Boolean).join("\n\n");
    if (description.length < 80) description = `${name}. ${description}`;
    rows.push({
      externalId: p.sku || p.id,
      title: cutTitle(name),
      description: description.slice(0, 9000),
      price: p.price,
      currency: "UZS",
      condition: t.condition,
      category: p.category.olxCategory || (settings.lang === "ru" ? p.category.nameRu || p.category.name : p.category.name),
      brand: p.brand ?? "",
      model: p.sku ?? "",
      images,
      url: absoluteUrl(`${settings.lang === "ru" ? "/ru" : ""}/product/${p.slug}`),
      stock: p.stock,
      available: isAvailable(p),
      city: settings.city,
      contactName: settings.contactName,
      phone: settings.phone,
    });
  }
  return { rows, skipped };
}

/** Column headers for the downloadable file (one row = one OLX advert). */
export const OLX_COLUMNS: { key: string; header: string; value: (r: OlxRow) => string | number }[] = [
  { key: "external_id", header: "external_id", value: (r) => r.externalId },
  { key: "title", header: "Заголовок", value: (r) => r.title },
  { key: "description", header: "Описание", value: (r) => r.description },
  { key: "price", header: "Цена", value: (r) => r.price },
  { key: "currency", header: "Валюта", value: (r) => r.currency },
  { key: "condition", header: "Состояние", value: (r) => r.condition },
  { key: "category", header: "Категория", value: (r) => r.category },
  { key: "brand", header: "Бренд", value: (r) => r.brand },
  { key: "model", header: "Модель", value: (r) => r.model },
  ...Array.from({ length: 8 }, (_, i) => ({ key: `photo_${i + 1}`, header: `Фото ${i + 1}`, value: (r: OlxRow) => r.images[i] ?? "" })),
  { key: "city", header: "Город", value: (r) => r.city },
  { key: "contact", header: "Контактное лицо", value: (r) => r.contactName },
  { key: "phone", header: "Телефон", value: (r) => r.phone },
  { key: "stock", header: "Наличие (шт)", value: (r) => r.stock },
  { key: "url", header: "Ссылка на сайт", value: (r) => r.url },
];

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** YML (Yandex Market Language) feed — the common XML format classified sites and prom.uz read from a URL. */
export function toYml(rows: OlxRow[]): string {
  const cats = [...new Set(rows.map((r) => r.category))];
  const catId = new Map(cats.map((c, i) => [c, i + 1]));
  const date = new Date().toISOString().slice(0, 16).replace("T", " ");
  const offers = rows
    .map(
      (r) => `    <offer id="${xml(r.externalId)}" available="${r.available ? "true" : "false"}">
      <url>${xml(r.url)}</url>
      <price>${r.price}</price>
      <currencyId>UZS</currencyId>
      <categoryId>${catId.get(r.category)}</categoryId>
${r.images.map((u) => `      <picture>${xml(u)}</picture>`).join("\n")}
      <name>${xml(r.title)}</name>
${r.brand ? `      <vendor>${xml(r.brand)}</vendor>\n` : ""}${r.model ? `      <model>${xml(r.model)}</model>\n` : ""}      <description><![CDATA[${r.description.replace(/]]>/g, "]] >")}]]></description>
      <condition type="new"/>
      <count>${r.stock}</count>
    </offer>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${date}">
  <shop>
    <name>${xml(COMPANY.brand)}</name>
    <company>${xml(COMPANY.legalName)}</company>
    <url>${xml(absoluteUrl("/"))}</url>
    <currencies><currency id="UZS" rate="1"/></currencies>
    <categories>
${cats.map((c) => `      <category id="${catId.get(c)}">${xml(c)}</category>`).join("\n")}
    </categories>
    <offers>
${offers}
    </offers>
  </shop>
</yml_catalog>
`;
}
