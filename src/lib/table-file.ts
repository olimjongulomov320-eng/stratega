import "server-only";
import readXlsxFile from "read-excel-file/node";
import { decodeCsvBytes, parseCsv } from "@/lib/csv";

/**
 * Reads an uploaded .csv or .xlsx file into rows of trimmed strings.
 * For .xlsx: the sheet named "Import" (any case) if there is one, otherwise the first sheet —
 * so a price-review workbook with a "Read me" sheet first can be uploaded as is.
 */
/** Text of an Excel cell. A real number is never "thousands": 12.345 must not look like the typed "12.345" (12 345). */
export function cellText(cell: unknown): string {
  if (cell === null || cell === undefined) return "";
  if (cell instanceof Date) return cell.toISOString().slice(0, 10);
  if (typeof cell === "number") {
    const text = String(cell);
    return /\.\d{3}$/.test(text) ? `${text}0` : text;
  }
  return String(cell).trim();
}

export async function readTableFile(file: File): Promise<string[][]> {
  const bytes = await file.arrayBuffer();
  const isXlsx = /\.xlsx$/i.test(file.name) || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (!isXlsx) return parseCsv(decodeCsvBytes(bytes));
  const sheets = await readXlsxFile(Buffer.from(bytes));
  const data = (sheets.find((s) => /^import$/i.test(s.sheet.trim())) ?? sheets[0])?.data ?? [];
  return data
    .map((row) =>
      row.map(cellText)
    )
    .filter((row) => row.some((v) => v !== ""));
}
