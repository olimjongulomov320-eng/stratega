import { prisma } from "@/lib/prisma";

const EXPECTED_HEADER = ["nomi", "telefon", "email", "manzil"];

export type SupplierImportRowResult =
  | { status: "created"; name: string }
  | { status: "updated"; name: string }
  | { status: "skipped"; name: string; reason: string };

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim()));
}

export async function applySuppliersImport(csvText: string): Promise<{
  created: SupplierImportRowResult[];
  updated: SupplierImportRowResult[];
  skipped: SupplierImportRowResult[];
  error?: string;
}> {
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return { created: [], updated: [], skipped: [], error: "Fayl bo'sh." };
  }

  const [header, ...dataRows] = rows;
  const normalizedHeader = header.map((h) => h.toLowerCase());
  const isValidHeader = EXPECTED_HEADER.every(
    (col, i) => normalizedHeader[i] === col
  );
  if (!isValidHeader) {
    return {
      created: [],
      updated: [],
      skipped: [],
      error: `Sarlavha noto'g'ri. Kutilgan: ${EXPECTED_HEADER.join(",")}`,
    };
  }

  const results: SupplierImportRowResult[] = [];

  for (const row of dataRows) {
    const [name, phone, email, address] = row;
    if (!name) continue;

    try {
      const existing = await prisma.supplier.findFirst({ where: { name } });
      if (existing) {
        await prisma.supplier.update({
          where: { id: existing.id },
          data: {
            phone: phone || existing.phone,
            email: email || existing.email,
            address: address || existing.address,
          },
        });
        results.push({ status: "updated", name });
      } else {
        await prisma.supplier.create({
          data: {
            name,
            phone: phone || null,
            email: email || null,
            address: address || null,
          },
        });
        results.push({ status: "created", name });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ status: "skipped", name, reason: message });
    }
  }

  return {
    created: results.filter((r) => r.status === "created"),
    updated: results.filter((r) => r.status === "updated"),
    skipped: results.filter((r) => r.status === "skipped"),
  };
}
