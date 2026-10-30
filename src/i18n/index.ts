import uz, { type Dictionary } from "./dictionaries/uz";
import ru from "./dictionaries/ru";
import en from "./dictionaries/en";
import type { Locale } from "./config";

const DICTS: Record<Locale, Dictionary> = { uz, ru, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTS[locale];
}

/** Replace {key} placeholders. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export type { Dictionary };
