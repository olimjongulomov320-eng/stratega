/**
 * Small RFC-4180 CSV parser. Handles quoted fields (commas, semicolons and
 * line breaks inside quotes) and auto-detects "," vs ";" (Excel in Russian
 * locale saves with ";").
 */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"' && field === "") quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows.map((r) => r.map((v) => v.trim()));
}

/**
 * "12 500,50" / "12500.5" / "12,500" / "125.000" / "1.250.000,50" → number (null when empty or invalid).
 * A single "," or "." before exactly three digits is a thousands separator ("125,000" is 125000, not 125);
 * "0,500" and "12,5" stay decimals. Pass `groups: false` for small decimal values (kW), where "1,500" means 1.5.
 */
export function parseNumber(value: string | undefined, { groups = true }: { groups?: boolean } = {}): number | null {
  if (value === undefined) return null;
  let v = value.replace(/[\s\u00a0]/g, "").replace(/so'?m|сум|usd|\$/gi, "");
  if (!v) return null;
  const isGrouped = (text: string, sep: string) => text.split(sep).every((part, i) => (i === 0 ? /^-?\d{1,3}$/ : /^\d{3}$/).test(part));
  if (v.includes(",") && v.includes(".")) {
    // Both separators: whichever comes last is the decimal point.
    const decimal = v.lastIndexOf(",") > v.lastIndexOf(".") ? "," : ".";
    const group = decimal === "," ? "." : ",";
    const whole = v.slice(0, v.lastIndexOf(decimal));
    if (!isGrouped(whole, group)) return null;
    v = `${whole.split(group).join("")}.${v.slice(v.lastIndexOf(decimal) + 1)}`;
  } else {
    const sep = v.includes(",") ? "," : v.includes(".") ? "." : null;
    if (sep) {
      const parts = v.split(sep);
      if (parts.length > 2) {
        // Several separators can only be digit groups; "125.000.00" or a date is a typo, not a number.
        if (!isGrouped(v, sep)) return null;
        v = parts.join("");
      } else {
        v = groups && /^-?[1-9]/.test(parts[0]) && isGrouped(v, sep) ? parts.join("") : parts.join(".");
      }
    }
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Decodes CSV bytes: UTF-8 first, falling back to Windows-1251 (older Excel "CSV" in Russian locale). */
export function decodeCsvBytes(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1251").decode(bytes);
  }
}
