import "server-only";
import { readTableFile } from "@/lib/table-file";

/**
 * Reads a CSV/XLSX contact list (suppliers or customers) into objects keyed by
 * our field names. The header row is matched by alias (uz / ru / en), so column
 * order does not matter and extra columns are ignored.
 */
export async function readContactFile<T extends Record<string, readonly string[]>>(
  file: File,
  aliases: T,
  required: keyof T & string,
  maxRows = 5000,
): Promise<{ rows: Partial<Record<keyof T & string, string>>[]; missing?: string }> {
  type K = keyof T & string;
  const table = await readTableFile(file);
  const header = (table.shift() ?? []).map((h) => h.toLowerCase().trim().replace(/\s+/g, "_"));
  const index = {} as Record<K, number>;
  for (const key of Object.keys(aliases) as K[]) {
    index[key] = header.findIndex((h) => aliases[key].includes(h));
  }
  if (index[required] < 0) return { rows: [], missing: aliases[required][0] };
  const rows = table.slice(0, maxRows).map((r) => {
    const o: Partial<Record<K, string>> = {};
    for (const key of Object.keys(index) as K[]) {
      const i = index[key];
      const v = i >= 0 ? (r[i] ?? "").trim() : "";
      if (v) o[key] = v;
    }
    return o;
  });
  return { rows: rows.filter((o) => o[required]) };
}

/** Normalises an INN/STIR: digits only. */
export const normInn = (v?: string | null) => (v ?? "").replace(/\D/g, "") || null;
/** Case/space-insensitive name key for de-duplication. */
export const nameKey = (v?: string | null) => (v ?? "").toLowerCase().replace(/["'«»`]/g, "").replace(/\s+/g, " ").trim();
