/**
 * Runs the admin product import (Mahsulotlar → Import) from the command line, with the same rules.
 *
 *   DATABASE_URL=... npx tsx --conditions=react-server scripts/import-products.ts <file.xlsx|.csv> --usd=12044.72 [--create-missing] [--apply]
 *
 * Without --apply it only reports what the file contains and which SKUs exist; with --apply it writes.
 * (--conditions=react-server lets the shared server-only modules load outside Next.js.)
 */
import "dotenv/config";
import { readFile } from "fs/promises";
import path from "path";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const APPLY = args.includes("--apply");
const createMissing = args.includes("--create-missing");
const usdArg = args.find((a) => a.startsWith("--usd="));
const usdRate = usdArg ? Number(usdArg.slice(6)) : null;

async function main() {
  if (!file) throw new Error("Usage: scripts/import-products.ts <file.xlsx|.csv> --usd=RATE [--create-missing] [--apply]");
  const { readTableFile } = await import("@/lib/table-file");
  const { importProductRows, COLS } = await import("@/lib/product-import");
  const { prisma } = await import("@/lib/prisma");

  const buf = await readFile(file);
  const table = await readTableFile(new File([buf], path.basename(file)));
  const header = (table[0] ?? []).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const skuCol = header.findIndex((h) => (COLS.sku as readonly string[]).includes(h));
  const skus = table.slice(1).map((r) => (r[skuCol] ?? "").trim()).filter(Boolean);
  const existing = await prisma.product.findMany({ where: { sku: { in: skus } }, select: { sku: true } });
  console.log(`${skus.length} rows with SKU: ${existing.length} already on the site, ${skus.length - existing.length} new.`);

  if (!APPLY) {
    console.log("Dry run — add --apply to write.");
  } else {
    const result = await importProductRows(table, { usdRate, createMissing, actor: "import script" });
    console.log(`Created ${result.created}, updated ${result.updated}.`);
    if (result.skipped.length) console.log(`Skipped (not on the site): ${result.skipped.join(", ")}`);
    if (result.errors.length) console.log(`Errors:\n  ${result.errors.join("\n  ")}`);
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
