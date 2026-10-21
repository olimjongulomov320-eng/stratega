import { prisma } from "@/lib/prisma";
import { writeAuditLog, actorContext } from "@/lib/audit";
import { parseCsv } from "@/lib/csv";

// CSV sarlavhalari: kompaniya,aloqa,telefon,email,inn,kredit_limiti
const EXPECTED_HEADER = [
  "kompaniya",
  "aloqa",
  "telefon",
  "email",
  "inn",
  "kredit_limiti",
];

export type CustomerImportRowResult =
  | { status: "created"; companyName: string }
  | { status: "updated"; companyName: string }
  | { status: "skipped"; companyName: string; reason: string };

export type CustomerPlannedRow = {
  row: number;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  taxId: string;
  creditLimit: number | null;
  action: "create" | "update" | "skip";
  reason?: string;
  changes: { field: string; from: string | number | null; to: string | number | null }[];
};

export type CustomerImportPreview = {
  error?: string;
  rows: CustomerPlannedRow[];
  toCreate: number;
  toUpdate: number;
  toSkip: number;
};

function parseCreditLimit(raw: string): number | null | "invalid" {
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    return "invalid";
  }
  return value;
}

async function planCustomerRows(csvText: string): Promise<CustomerImportPreview> {
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return { rows: [], toCreate: 0, toUpdate: 0, toSkip: 0, error: "Fayl bo'sh." };
  }

  const [header, ...dataRows] = rows;
  const normalizedHeader = header.map((h) => h.toLowerCase());
  const isValidHeader = EXPECTED_HEADER.every(
    (col, i) => normalizedHeader[i] === col
  );
  if (!isValidHeader) {
    return {
      rows: [],
      toCreate: 0,
      toUpdate: 0,
      toSkip: 0,
      error: `Sarlavha noto'g'ri. Kutilgan: ${EXPECTED_HEADER.join(",")}`,
    };
  }

  const planned: CustomerPlannedRow[] = [];
  let rowNumber = 1;

  for (const row of dataRows) {
    const [companyName, contactName, phone, email, taxId, creditLimitRaw] = row;
    rowNumber++;
    if (!companyName) continue;

    const creditLimit = parseCreditLimit(creditLimitRaw ?? "");
    if (creditLimit === "invalid") {
      planned.push({
        row: rowNumber,
        companyName,
        contactName: contactName ?? "",
        phone: phone ?? "",
        email: email ?? "",
        taxId: taxId ?? "",
        creditLimit: null,
        action: "skip",
        reason: `Kredit limiti noto'g'ri: "${creditLimitRaw}"`,
        changes: [],
      });
      continue;
    }

    const existing = await prisma.customer.findFirst({
      where: { companyName },
      select: {
        id: true,
        contactName: true,
        phone: true,
        email: true,
        taxId: true,
        creditLimit: true,
      },
    });

    if (!existing) {
      planned.push({
        row: rowNumber,
        companyName,
        contactName: contactName ?? "",
        phone: phone ?? "",
        email: email ?? "",
        taxId: taxId ?? "",
        creditLimit,
        action: "create",
        changes: [],
      });
      continue;
    }

    const changes: CustomerPlannedRow["changes"] = [];
    if (contactName && contactName !== existing.contactName) {
      changes.push({ field: "Aloqa", from: existing.contactName, to: contactName });
    }
    if (phone && phone !== existing.phone) {
      changes.push({ field: "Telefon", from: existing.phone, to: phone });
    }
    if (email && email !== existing.email) {
      changes.push({ field: "Email", from: existing.email, to: email });
    }
    if (taxId && taxId !== existing.taxId) {
      changes.push({ field: "INN", from: existing.taxId, to: taxId });
    }
    if (creditLimit !== null && creditLimit !== existing.creditLimit) {
      changes.push({ field: "Kredit limiti", from: existing.creditLimit, to: creditLimit });
    }

    if (changes.length === 0) {
      planned.push({
        row: rowNumber,
        companyName,
        contactName: contactName ?? "",
        phone: phone ?? "",
        email: email ?? "",
        taxId: taxId ?? "",
        creditLimit,
        action: "skip",
        reason: "O'zgarish yo'q",
        changes: [],
      });
    } else {
      planned.push({
        row: rowNumber,
        companyName,
        contactName: contactName ?? "",
        phone: phone ?? "",
        email: email ?? "",
        taxId: taxId ?? "",
        creditLimit,
        action: "update",
        changes,
      });
    }
  }

  return {
    rows: planned,
    toCreate: planned.filter((r) => r.action === "create").length,
    toUpdate: planned.filter((r) => r.action === "update").length,
    toSkip: planned.filter((r) => r.action === "skip").length,
  };
}

export async function previewCustomersImport(
  csvText: string
): Promise<CustomerImportPreview> {
  return planCustomerRows(csvText);
}

export async function applyCustomersImport(
  csvText: string,
  options: { preview?: CustomerImportPreview } = {}
): Promise<{
  created: CustomerImportRowResult[];
  updated: CustomerImportRowResult[];
  skipped: CustomerImportRowResult[];
  error?: string;
}> {
  const plan = options.preview ?? (await planCustomerRows(csvText));
  if (plan.error) {
    return { created: [], updated: [], skipped: [], error: plan.error };
  }

  const actor = await actorContext();
  // Rejalashtirishda skip qilingan qatorlar ham hisobotda ko'rinadi —
  // aks holda foydalanuvchi "nima uchun o'zgarmadi" ni ko'rolmaydi.
  const results: CustomerImportRowResult[] = plan.rows
    .filter((r) => r.action === "skip")
    .map((r) => ({
      status: "skipped" as const,
      companyName: r.companyName,
      reason: r.reason ?? "O'zgarish yo'q",
    }));

  for (const planned of plan.rows.filter((r) => r.action !== "skip")) {
    try {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.customer.findFirst({
          where: { companyName: planned.companyName },
          select: { id: true },
        });

        if (planned.action === "update" && existing) {
          const pick = (field: string) =>
            planned.changes.find((c) => c.field === field)?.to;
          await tx.customer.update({
            where: { id: existing.id },
            data: {
              contactName: (pick("Aloqa") as string | undefined) ?? undefined,
              phone: (pick("Telefon") as string | undefined) ?? undefined,
              email: (pick("Email") as string | undefined) ?? undefined,
              taxId: (pick("INN") as string | undefined) ?? undefined,
              creditLimit:
                (pick("Kredit limiti") as number | undefined) ?? undefined,
            },
          });
          results.push({ status: "updated", companyName: planned.companyName });
        } else {
          await tx.customer.create({
            data: {
              companyName: planned.companyName,
              contactName: planned.contactName || null,
              phone: planned.phone || null,
              email: planned.email || null,
              taxId: planned.taxId || null,
              creditLimit: planned.creditLimit,
            },
          });
          results.push({ status: "created", companyName: planned.companyName });
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        status: "skipped",
        companyName: planned.companyName,
        reason: message,
      });
    }
  }

  await writeAuditLog({
    ...actor,
    action: "import.customers",
    entity: "Customer",
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
