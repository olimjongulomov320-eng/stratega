import uz, { type Dictionary } from "./dictionaries/uz";
import ru from "./dictionaries/ru";
import en from "./dictionaries/en";
import type { Locale } from "./config";

const DICTS: Record<Locale, Dictionary> = { uz, ru, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTS[locale];
}

/** Plural form for a count: 3 forms = Russian (1 товар / 2 товара / 5 товаров), 2 forms = English. */
function plural(n: number, forms: string[]): string {
  if (forms.length === 2) return n === 1 ? forms[0] : forms[1];
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

/** Replace {key} placeholders; {key|form1|form2|…} picks the plural form for that number. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template
    .replace(/\{(\w+)\|([^{}]+)\}/g, (m, k, forms) => (k in vars ? plural(Number(vars[k]), forms.split("|")) : m))
    .replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export type { Dictionary };
