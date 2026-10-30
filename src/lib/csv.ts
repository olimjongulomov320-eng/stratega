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

/** "12 500,50" / "12500.5" / "12,500" → number (null when empty or invalid). */
export function parseNumber(value: string | undefined): number | null {
  if (value === undefined) return null;
  let v = value.replace(/[\s ]/g, "").replace(/so'?m|сум|usd|\$/gi, "");
  if (!v) return null;
  if (v.includes(",") && !v.includes(".")) v = /,\d{3}$/.test(v) && v.split(",").length > 2 ? v.replace(/,/g, "") : v.replace(",", ".");
  else v = v.replace(/,/g, "");
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
