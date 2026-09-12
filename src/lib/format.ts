const CURRENCY_SUFFIX: Record<string, string> = {
  uz: "so'm",
  ru: "сум",
  en: "UZS",
};

export function formatSum(value: number, locale: string = "uz"): string {
  const grouped = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const suffix = CURRENCY_SUFFIX[locale] ?? CURRENCY_SUFFIX.uz;
  return `${grouped} ${suffix}`;
}
