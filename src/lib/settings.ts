import { prisma } from "@/lib/prisma";

export const SETTING_DEFS = [
  { key: "stock.lowStockThreshold", label: "Kam qoldiq chegarasi", hint: "Qoldiq shu sondan kam yoki teng bo'lsa — \"kam qolgan\".", type: "number", default: 2 },
  { key: "stock.overstockMultiplier", label: "Ortiqcha ombor koeffitsienti", hint: "Qoldiq shu oylik sotuvdan ko'p bo'lsa — ortiqcha ombor.", type: "number", default: 6 },
  { key: "stock.allowNegative", label: "Manfiy qoldiqqa ruxsat", hint: "Yoqilsa, chiqim qoldiqdan ko'p bo'lishi mumkin (tavsiya etilmaydi).", type: "boolean", default: false },
  { key: "stock.allowOverReserve", label: "Ortiqcha band qilishga ruxsat", hint: "Yoqilsa, buyurtma mavjud qoldiqdan ko'proq band qilishi mumkin.", type: "boolean", default: false },
  { key: "forecast.lookbackDays", label: "Prognoz davri (kun)", hint: "Sotuv tezligi shu kunlar bo'yicha hisoblanadi.", type: "number", default: 90 },
  { key: "finance.paymentOverdueDays", label: "To'lov kechikish chegarasi (kun)", hint: "Tasdiqlangan buyurtma shu kundan keyin to'lanmasa — kechikkan.", type: "number", default: 45 },
  { key: "company.name", label: "Kompaniya nomi (hujjatlarda)", hint: "", type: "text", default: "OOO «STRATEGA»" },
] as const;

export type SettingKey = (typeof SETTING_DEFS)[number]["key"];

export async function getSettings(): Promise<Record<SettingKey, unknown>> {
  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return Object.fromEntries(SETTING_DEFS.map((d) => [d.key, map.has(d.key) ? map.get(d.key) : d.default])) as Record<SettingKey, unknown>;
}

export async function getSetting<T>(key: SettingKey): Promise<T> {
  const row = await prisma.setting.findUnique({ where: { key } });
  const def = SETTING_DEFS.find((d) => d.key === key)!;
  return (row ? row.value : def.default) as T;
}

export const getLowStockThreshold = () => getSetting<number>("stock.lowStockThreshold");
