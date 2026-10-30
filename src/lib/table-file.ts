import "server-only";
import readXlsxFile from "read-excel-file/node";
import { decodeCsvBytes, parseCsv } from "@/lib/csv";

/**
 * Reads an uploaded .csv or .xlsx file into rows of trimmed strings.
 * For .xlsx: the sheet named "Import" (any case) if there is one, otherwise the first sheet —
 * so a price-review workbook with a "Read me" sheet first can be uploaded as is.
 */
export async function readTableFile(file: File): Promise<string[][]> {
  const bytes = await file.arrayBuffer();
  const isXlsx = /\.xlsx$/i.test(file.name) || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (!isXlsx) return parseCsv(decodeCsvBytes(bytes));
  const sheets = await readXlsxFile(Buffer.from(bytes));
  const data = (sheets.find((s) => /^import$/i.test(s.sheet.trim())) ?? sheets[0])?.data ?? [];
  return data
    .map((row) =>
      row.map((cell) => {
        if (cell === null || cell === undefined) return "";
        if (cell instanceof Date) return cell.toISOString().slice(0, 10);
        return String(cell).trim();
      })
    )
    .filter((row) => row.some((v) => v !== ""));
}
