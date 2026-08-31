// Bir martalik migratsiya: mavjud Product.stock qiymatlarini yangi
// Warehouse/Stock modeliga ko'chirish. "Asosiy ombor" yaratiladi va har bir
// mahsulot uchun shu ombordagi Stock yozuvi Product.stock bilan tenglashtiriladi.
//
// Ishga tushirish: npx tsx prisma/migrate-to-warehouse.ts

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const MAIN_WAREHOUSE_CODE = "MAIN";

async function main() {
  const warehouse = await prisma.warehouse.upsert({
    where: { code: MAIN_WAREHOUSE_CODE },
    create: {
      code: MAIN_WAREHOUSE_CODE,
      name: "Asosiy ombor",
      isActive: true,
    },
    update: {},
  });

  console.log(`Ombor tayyor: ${warehouse.name} (${warehouse.id})`);

  const products = await prisma.product.findMany({
    select: { id: true, name: true, stock: true },
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const existing = await prisma.stock.findUnique({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: warehouse.id,
        },
      },
    });

    if (existing) {
      if (existing.quantity !== product.stock) {
        await prisma.stock.update({
          where: { id: existing.id },
          data: { quantity: product.stock },
        });
        updated++;
      } else {
        skipped++;
      }
      continue;
    }

    await prisma.stock.create({
      data: {
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: product.stock,
        reserved: 0,
      },
    });
    created++;
  }

  console.log(
    `Tayyor: ${created} ta yaratildi, ${updated} ta yangilandi, ${skipped} ta o'zgarishsiz qoldi (jami ${products.length} mahsulot).`
  );

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
