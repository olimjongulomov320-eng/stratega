import type { Locale } from "@/i18n/config";

const CURRENCY: Record<Locale, string> = { uz: "so'm", ru: "сум", en: "UZS" };

export function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** "1 920 000 so'm" / "1 920 000 сум" / "1 920 000 UZS" */
export function formatSum(value: number, locale: Locale = "uz"): string {
  return `${formatNumber(value)} ${CURRENCY[locale]}`;
}

export function formatDate(date: Date | string, withTime = false): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const pad = (n: number) => String(n).padStart(2, "0");
  const base = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  return withTime ? `${base}, ${pad(d.getHours())}:${pad(d.getMinutes())}` : base;
}

/** Date N days before now (server-side helper; keeps Date.now out of render bodies). */
export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86400000);
}
