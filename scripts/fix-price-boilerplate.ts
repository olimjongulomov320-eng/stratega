/**
 * One-off: imported descriptions say "ask the manager for the price", which contradicts a price shown
 * on the page. For products that have a real price (not "price on request"), drops only the word
 * "price" from that exact boilerplate sentence; everything else in the description stays as it is.
 *
 *   DATABASE_URL=... npx tsx scripts/fix-price-boilerplate.ts           # dry run
 *   DATABASE_URL=... npx tsx scripts/fix-price-boilerplate.ts --apply   # writes
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const APPLY = process.argv.includes("--apply");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const REPLACE: [string, string][] = [
  ["Narx, mavjudlik va QQS bilan hisob-faktura bo'yicha menejerga murojaat qiling.", "Mavjudlik va QQS bilan hisob-faktura bo'yicha menejerga murojaat qiling."],
  ["Цену, наличие и счёт-фактуру с НДС уточняйте у менеджера.", "Наличие и счёт-фактуру с НДС уточняйте у менеджера."],
  ["Price, availability and VAT invoice: please contact the manager.", "Availability and VAT invoice: please contact the manager."],
];
const fix = (text: string | null) => (text ? REPLACE.reduce((t, [a, b]) => t.split(a).join(b), text) : text);

async function main() {
  const products = await prisma.product.findMany({
    where: { priceOnRequest: false, price: { gt: 0 } },
    select: { id: true, sku: true, description: true, descriptionRu: true, descriptionEn: true },
  });
  let changed = 0;
  for (const p of products) {
    const data = { description: fix(p.description) ?? "", descriptionRu: fix(p.descriptionRu), descriptionEn: fix(p.descriptionEn) };
    if (data.description === p.description && data.descriptionRu === p.descriptionRu && data.descriptionEn === p.descriptionEn) continue;
    changed++;
    if (APPLY) await prisma.product.update({ where: { id: p.id }, data });
  }
  console.log(`${APPLY ? "Updated" : "Would update (dry run, add --apply)"}: ${changed} of ${products.length} priced products.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
