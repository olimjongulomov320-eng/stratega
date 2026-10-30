/**
 * One-off: Russian names for the TURAN / PPR welders and their category.
 *
 *   DATABASE_URL=... npx tsx scripts/fill-welder-ru-names.ts           # dry run: prints what would change
 *   DATABASE_URL=... npx tsx scripts/fill-welder-ru-names.ts --apply   # writes
 *
 * Matches products by SKU. Only touches nameRu (products) and name/nameRu (category);
 * SKUs that are not in the database are reported and skipped.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const APPLY = process.argv.includes("--apply");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const PRODUCT_NAMES_RU: Record<string, string> = {
  "CN-63/200": "Аппарат для стыковой сварки ПНД труб TURAN CN-63/200 (63–200 мм)",
  "CN-63/250": "Аппарат для стыковой сварки ПНД труб TURAN CN-63/250 (63–250 мм)",
  "CN-90/315H": "Гидравлический аппарат для сварки ПНД труб TURAN CN-90/315H (90–315 мм)",
  "CN-160/450H": "Гидравлический аппарат для сварки ПНД труб TURAN CN-160/450H (160–450 мм)",
  "CN-160/500H": "Гидравлический аппарат для сварки ПНД труб TURAN CN-160/500H (160–500 мм)",
  "CN-315/630H": "Гидравлический аппарат для сварки ПНД труб TURAN CN-315/630H (315–630 мм)",
  "CN-026": "Аппарат для сварки полипропиленовых (PPR) труб CN-026 (20–63 мм)",
};

const CATEGORY_SLUG = "payvandlash-apparatlari";
const CATEGORY_NAME = "PE (PND) quvur payvandlash apparatlari";
const CATEGORY_NAME_RU = "Аппараты для сварки ПНД труб";

async function main() {
  console.log(APPLY ? "APPLY: writing changes" : "DRY RUN: nothing is written (add --apply)");

  for (const [sku, nameRu] of Object.entries(PRODUCT_NAMES_RU)) {
    const product = await prisma.product.findUnique({ where: { sku }, select: { id: true, nameRu: true } });
    if (!product) {
      console.log(`  skip  ${sku}: not found`);
      continue;
    }
    if (product.nameRu === nameRu) {
      console.log(`  same  ${sku}`);
      continue;
    }
    console.log(`  set   ${sku}: "${product.nameRu ?? ""}" → "${nameRu}"`);
    if (APPLY) await prisma.product.update({ where: { id: product.id }, data: { nameRu } });
  }

  const category = await prisma.category.findUnique({ where: { slug: CATEGORY_SLUG }, select: { id: true, name: true, nameRu: true } });
  if (!category) {
    console.log(`  skip  category ${CATEGORY_SLUG}: not found`);
  } else if (category.name === CATEGORY_NAME && category.nameRu === CATEGORY_NAME_RU) {
    console.log(`  same  category ${CATEGORY_SLUG}`);
  } else {
    console.log(`  set   category ${CATEGORY_SLUG}: "${category.name}" / "${category.nameRu ?? ""}" → "${CATEGORY_NAME}" / "${CATEGORY_NAME_RU}"`);
    if (APPLY) await prisma.category.update({ where: { id: category.id }, data: { name: CATEGORY_NAME, nameRu: CATEGORY_NAME_RU } });
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
