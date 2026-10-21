import { prisma } from "@/lib/prisma";
import { writeAuditLog, actorContext } from "@/lib/audit";
import { parseCsv } from "@/lib/csv";

const EXPECTED_HEADER = ["nomi", "telefon", "email", "manzil"];

export type SupplierImportRowResult =
  | { status: "created"; name: string }
  | { status: "updated"; name: string }
  | { status: "skipped"; name: string; reason: string };

export type SupplierPlannedRow = {
  row: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  action: "create" | "update" | "skip";
  reason?: string;
  changes: { field: string; from: string; to: string }[];
};

export type SupplierImportPreview = {
  error?: string;
  rows: SupplierPlannedRow[];
  toCreate: number;
  toUpdate: number;
  toSkip: number;
};

async function planSupplierRows(csvText: string): Promise<SupplierImportPreview> {
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return { rows: [], toCreate: 0, toUpdate: 0, toSkip: 0, error: "Fayl bo'sh." };
  }

  const [header, ...dataRows] = rows;
  const normalizedHeader = header.map((h) => h.toLowerCase());
  const isValidHeader = EXPECTED_HEADER.every((col, i) => normalizedHeader[i] === col);
  if (!isValidHeader) {
    return {
      rows: [],
      toCreate: 0,
      toUpdate: 0,
      toSkip: 0,
      error: `Sarlavha noto'g'ri. Kutilgan: ${EXPECTED_HEADER.join(",")}`,
    };
  }

  const planned: SupplierPlannedRow[] = [];
  let rowNumber = 1;

  for (const row of dataRows) {
    const [name, phone, email, address] = row;
    rowNumber++;
    if (!name) continue;

    const existing = await prisma.supplier.findFirst({
      where: { name },
      select: { id: true, phone: true, email: true, address: true },
    });

    if (!existing) {
      planned.push({ row: rowNumber, name, phone, email, address, action: "create", changes: [] });
      continue;
    }

    const changes: SupplierPlannedRow["changes"] = [];
    if (phone && phone !== existing.phone) changes.push({ field: "Telefon", from: existing.phone ?? "", to: phone });
    if (email && email !== existing.email) changes.push({ field: "Email", from: existing.email ?? "", to: email });
    if (address && address !== existing.address) changes.push({ field: "Manzil", from: existing.address ?? "", to: address });

    if (changes.length === 0) {
      planned.push({ row: rowNumber, name, phone, email, address, action: "skip", reason: "O'zgarish yo'q", changes: [] });
    } else {
      planned.push({ row: rowNumber, name, phone, email, address, action: "update", changes });
    }
  }

  return {
    rows: planned,
    toCreate: planned.filter((r) => r.action === "create").length,
    toUpdate: planned.filter((r) => r.action === "update").length,
    toSkip: planned.filter((r) => r.action === "skip").length,
  };
}

export async function previewSuppliersImport(csvText: string): Promise<SupplierImportPreview> {
  return planSupplierRows(csvText);
}

export async function applySuppliersImport(
  csvText: string,
  options: { preview?: SupplierImportPreview } = {}
): Promise<{
  created: SupplierImportRowResult[];
  updated: SupplierImportRowResult[];
  skipped: SupplierImportRowResult[];
  error?: string;
}> {
  const plan = options.preview ?? (await planSupplierRows(csvText));
  if (plan.error) {
    return { created: [], updated: [], skipped: [], error: plan.error };
  }

  const actor = await actorContext();
  const results: SupplierImportRowResult[] = [];

  for (const planned of plan.rows.filter((r) => r.action !== "skip")) {
    try {
      // Har bir qator alohida tranzaksiyada — qisman muvaffaqiyatli
      // importlarda yagona qator xatosi butun faylni buzmaydi.
      await prisma.$transaction(async (tx) => {
        const existing = await tx.supplier.findFirst({ where: { name: planned.name } });
        if (planned.action === "update" && existing) {
          const phoneChange = planned.changes.find((c) => c.field === "Telefon");
          const emailChange = planned.changes.find((c) => c.field === "Email");
          const addressChange = planned.changes.find((c) => c.field === "Manzil");
          await tx.supplier.update({
            where: { id: existing.id },
            data: {
              phone: phoneChange ? phoneChange.to : existing.phone,
              email: emailChange ? emailChange.to : existing.email,
              address: addressChange ? addressChange.to : existing.address,
            },
          });
          results.push({ status: "updated", name: planned.name });
        } else {
          await tx.supplier.create({
            data: {
              name: planned.name,
              phone: planned.phone || null,
              email: planned.email || null,
              address: planned.address || null,
            },
          });
          results.push({ status: "created", name: planned.name });
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ status: "skipped", name: planned.name, reason: message });
    }
  }

  await writeAuditLog({
    ...actor,
    action: "import.suppliers",
    entity: "Supplier",
    entityId: "csv",
    newData: {
      created: results.filter((r) => r.status === "created").length,
      updated: results.filter((r) => r.status === "updated").length,
      skipped: results.filter((r) => r.status === "skipped").length,
    },
  });

  return {
    created: results.filter((r) => r.status === "created"),
    updated: results.filter((r) => r.status === "updated"),
    skipped: results.filter((r) => r.status === "skipped"),
  };
}
