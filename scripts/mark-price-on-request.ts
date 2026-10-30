/**
 * One-off: switch on "price on request" for products whose price is an import placeholder.
 *
 *   DATABASE_URL=... npx tsx scripts/mark-price-on-request.ts                    # dry run, placeholder 10 000 000
 *   DATABASE_URL=... npx tsx scripts/mark-price-on-request.ts --apply            # writes
 *   DATABASE_URL=... npx tsx scripts/mark-price-on-request.ts --price=5000000    # another placeholder value
 *
 * Only sets priceOnRequest = true; the price itself is kept, so nothing is lost.
 * Undo for one product: untick "Narxi so'rov bo'yicha" in the admin product form.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const APPLY = process.argv.includes("--apply");
const priceArg = process.argv.find((a) => a.startsWith("--price="));
const PLACEHOLDER = priceArg ? Number(priceArg.slice("--price=".length)) : 10_000_000;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  if (!Number.isInteger(PLACEHOLDER) || PLACEHOLDER <= 0) throw new Error("--price must be a positive whole number");
  const where = { price: PLACEHOLDER, priceOnRequest: false };
  const products = await prisma.product.findMany({ where, select: { sku: true, name: true, category: { select: { slug: true } } }, orderBy: { name: "asc" } });

  const byCategory = new Map<string, number>();
  for (const p of products) byCategory.set(p.category.slug, (byCategory.get(p.category.slug) ?? 0) + 1);
  console.log(`${APPLY ? "APPLY" : "DRY RUN (add --apply to write)"}: ${products.length} products priced exactly ${PLACEHOLDER} so'm`);
  for (const [slug, n] of [...byCategory].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${slug}`);

  if (APPLY && products.length) {
    const { count } = await prisma.product.updateMany({ where, data: { priceOnRequest: true } });
    console.log(`Marked ${count} products as "price on request".`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
