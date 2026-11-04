import type { Locale } from "@/i18n/config";

/** One row of the product spec table (stored in Product.specs). */
export type SpecRow = { uz?: string; ru?: string; en?: string; value: string };

/** The four filterable spec fields, with URL params and labels. */
export const SPEC_FILTERS = [
  { field: "capacityKg", int: false, min: "capMin", max: "capMax", unit: { uz: "kg", ru: "кг", en: "kg" }, label: { uz: "Yuk ko'tarish quvvati", ru: "Грузоподъёмность", en: "Capacity" } },
  { field: "liftHeightMm", int: true, min: "liftMin", max: "liftMax", unit: { uz: "mm", ru: "мм", en: "mm" }, label: { uz: "Ko'tarish balandligi", ru: "Высота подъёма", en: "Lift height" } },
  { field: "workingWidthMm", int: true, min: "widthMin", max: "widthMax", unit: { uz: "mm", ru: "мм", en: "mm" }, label: { uz: "Ishchi kenglik", ru: "Ширина уборки / обработки", en: "Working width" } },
  { field: "powerKw", int: false, min: "powMin", max: "powMax", unit: { uz: "kVt", ru: "кВт", en: "kW" }, label: { uz: "Quvvat", ru: "Мощность", en: "Power" } },
] as const;

export type SpecField = (typeof SPEC_FILTERS)[number]["field"];

/** Parses Product.specs JSON defensively — anything malformed is dropped. */
export function parseSpecRows(json: unknown): SpecRow[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map((r) => ({
      uz: typeof r.uz === "string" ? r.uz : undefined,
      ru: typeof r.ru === "string" ? r.ru : undefined,
      en: typeof r.en === "string" ? r.en : undefined,
      value: typeof r.value === "string" || typeof r.value === "number" ? String(r.value).trim() : "",
    }))
    .filter((r) => r.value && (r.uz || r.ru || r.en))
    .slice(0, 40);
}

export function specLabel(row: SpecRow, locale: Locale): string {
  return row[locale] || row.uz || row.ru || row.en || "";
}

/**
 * Spec rows typed in the admin as one row per line: "Akkumulyator | Аккумулятор | 24 V 100 Ah"
 * (Uzbek label | Russian label | value) or "Akkumulyator: 24 V 100 Ah" (one label for all languages).
 */
export function parseSpecText(text: string): SpecRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line): SpecRow | null => {
      const parts = line.split("|").map((p) => p.trim());
      if (parts.length >= 3) return { uz: parts[0], ru: parts[1], value: parts.slice(2).join(" | ") };
      if (parts.length === 2) return { uz: parts[0], ru: parts[0], value: parts[1] };
      const m = line.match(/^([^:]+):\s*(.+)$/);
      return m ? { uz: m[1].trim(), ru: m[1].trim(), value: m[2].trim() } : null;
    })
    .filter((r): r is SpecRow => r !== null && r.value !== "")
    .slice(0, 40);
}

export function specText(rows: SpecRow[]): string {
  return rows.map((r) => `${r.uz ?? ""} | ${r.ru ?? ""} | ${r.value}`).join("\n");
}

/** YouTube video id from the usual URL shapes, or null. */
export function youTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

const n = (s: string) => Number(s.replace(",", "."));

/**
 * Best-effort spec values read from a product name, used by the seed script to fill empty filter fields.
 * Only clear patterns are used: "2,5 t" / "500 kg" (capacity), "3 m" / "1600 mm" lift height (stackers and lifting tables),
 * "530 mm" working width (cleaning machines, cultivators), "5 kVt" / "7 o.k." (power).
 */
export function specsFromName(name: string, categorySlug: string): Partial<Record<SpecField, number>> {
  const out: Partial<Record<SpecField, number>> = {};
  const lower = name.toLowerCase();
  // Capacity: take the first "x t" or "x kg" (ranges like "2–3 t" → the upper value).
  const t = lower.match(/(\d+(?:[.,]\d+)?)(?:\s*[–-]\s*(\d+(?:[.,]\d+)?))?\s*t\b/);
  const kg = lower.match(/(\d+(?:[.,]\d+)?)(?:\/\d+)?\s*kg\b/);
  const isLifting = /telejka|shtabeler|tal|strop|stol|richtrak|ortgich|aravacha/.test(categorySlug);
  if (isLifting) {
    if (t) out.capacityKg = Math.round(n(t[2] ?? t[1]) * 1000);
    else if (kg) out.capacityKg = Math.round(n(kg[1]));
  }
  if (/shtabeler|stol|richtrak/.test(categorySlug)) {
    const mm = lower.match(/(\d{3,4})\s*[–-]\s*(\d{3,4})\s*mm/);
    const m = lower.match(/(\d+(?:[.,]\d+)?)(?:\s*[–-]\s*(\d+(?:[.,]\d+)?))?\s*m\b/);
    if (mm) out.liftHeightMm = Number(mm[2]);
    else if (m) out.liftHeightMm = Math.round(n(m[2] ?? m[1]) * 1000);
  }
  if (/pol-yuvish|supurish|kultivator|motoblok/.test(categorySlug)) {
    const w = lower.match(/(\d{3,4})\s*mm/);
    if (w) out.workingWidthMm = Number(w[1]);
  }
  const kw = lower.match(/(\d+(?:[.,]\d+)?)\s*kvt\b/);
  const hp = lower.match(/(\d+(?:[.,]\d+)?)\s*o\.k\./);
  if (kw) out.powerKw = n(kw[1]);
  else if (hp) out.powerKw = Math.round(n(hp[1]) * 0.7355 * 10) / 10;
  return out;
}
