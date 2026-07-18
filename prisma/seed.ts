import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const categories = [
  {
    slug: "elektr-shtabelerlar",
    name: "Elektr shtabelerlar",
    icon: "🏗️",
    sortOrder: 1,
  },
  {
    slug: "gidravlik-telejkalar",
    name: "Gidravlik telejkalar",
    icon: "🛠️",
    sortOrder: 2,
  },
];

const products = [
  // Elektr shtabelerlar
  {
    slug: "shtabeler-elektr-avtomat-35m",
    name: "Elektr shtabeler (avtomat), 2T / 3.5m",
    description:
      "To'liq avtomatik boshqaruvli elektr shtabeler. Yuk ko'tarish qobiliyati 2 tonna, ko'tarish balandligi 3.5 metr. Mustahkam va ishonchli konstruksiya, omborlar va logistika markazlari uchun ideal.",
    price: 37500000,
    categorySlug: "elektr-shtabelerlar",
    rating: 4.8,
    reviewCount: 12,
    soldCount: 9,
    isFeatured: true,
    stock: 6,
  },
  {
    slug: "shtabeler-elektr-avtomat-45m",
    name: "Elektr shtabeler (avtomat, o'z yurar), 2T / 4.5m",
    description:
      "Samoxod (o'z yurar) elektr shtabeler, kuchaytirilgan va ishonchli konstruksiya. Yuk ko'tarish qobiliyati 2 tonna, ko'tarish balandligi 4.5 metr — baland stellajli omborlar uchun.",
    price: 44800000,
    categorySlug: "elektr-shtabelerlar",
    rating: 4.9,
    reviewCount: 7,
    soldCount: 5,
    isFeatured: true,
    stock: 3,
  },
  {
    slug: "shtabeler-elektr-poluavtomat-3m",
    name: "Elektr shtabeler (pol avtomat), 2T / 3m",
    description:
      "Pol avtomatik boshqaruvli elektr shtabeler. Yuk ko'tarish qobiliyati 2 tonna, ko'tarish balandligi 3 metr. Mustahkam va ishonchli konstruksiya, qulay narxda samarali yechim.",
    price: 19710000,
    categorySlug: "elektr-shtabelerlar",
    rating: 4.6,
    reviewCount: 15,
    soldCount: 11,
    stock: 8,
  },
  {
    slug: "shtabeler-elektr-poluavtomat-16m",
    name: "Elektr shtabeler (pol avtomat), 2T / 1.6m",
    description:
      "Kompakt pol avtomatik elektr shtabeler. Yuk ko'tarish qobiliyati 2 tonna, ko'tarish balandligi 1.6 metr. Tor joylarda va kichik omborlarda ishlash uchun qulay.",
    price: 16900000,
    categorySlug: "elektr-shtabelerlar",
    rating: 4.5,
    reviewCount: 9,
    soldCount: 8,
    stock: 7,
  },

  // Gidravlik telejkalar
  {
    slug: "shtabeler-gidravlik-qolda-16m",
    name: "Qo'l gidravlik shtabeler, 2T / 1.60m",
    description:
      "Qo'lda boshqariladigan gidravlik shtabeler. Yuk ko'tarish qobiliyati 2 tonna, ko'tarish balandligi 1.60 metr. Sifatli gidravlika, oson harakatlanish, elektr manbasiz ishlaydi.",
    price: 9220000,
    categorySlug: "gidravlik-telejkalar",
    rating: 4.7,
    reviewCount: 18,
    soldCount: 14,
    isFeatured: true,
    stock: 10,
  },
  {
    slug: "telejka-gidravlik-rulon-180sm",
    name: "Gidravlik telejka rulon uchun, 3T / 180sm",
    description:
      "Rulon materiallarni tashish uchun maxsus konstruksiyali gidravlik telejka. Yuk ko'tarish qobiliyati 3 tonna, vilka uzunligi 180 sm. Qo'l gidravlik boshqaruv.",
    price: 8320000,
    categorySlug: "gidravlik-telejkalar",
    rating: 4.6,
    reviewCount: 11,
    soldCount: 9,
    stock: 12,
  },
  {
    slug: "telejka-gidravlik-tarozili",
    name: "Gidravlik telejka elektron tarozi bilan, 3T",
    description:
      "Elektron tarozi bilan jihozlangan gidravlik telejka. Yuk ko'tarish qobiliyati 3 tonna, yuklarni tashish jarayonida vaznini aniq o'lchash imkoniyati.",
    price: 5760000,
    oldPrice: 6400000,
    categorySlug: "gidravlik-telejkalar",
    rating: 4.7,
    reviewCount: 14,
    soldCount: 16,
    isFeatured: true,
    stock: 9,
  },
  {
    slug: "telejka-gidravlik-standart-120sm",
    name: "Gidravlik telejka (rohlya), 3T / 120sm",
    description:
      "Standart qo'l gidravlik telejka (rohlya). Yuk ko'tarish qobiliyati 3 tonna, vilka uzunligi 120 sm. Mustahkam va ishonchli konstruksiya, ombor va do'konlar uchun.",
    price: 1920000,
    categorySlug: "gidravlik-telejkalar",
    rating: 4.5,
    reviewCount: 23,
    soldCount: 27,
    stock: 20,
  },
];

async function main() {
  await prisma.rfqItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  for (const category of categories) {
    await prisma.category.create({ data: category });
  }

  const categoryMap = new Map(
    (await prisma.category.findMany()).map((c) => [c.slug, c.id])
  );

  for (const { categorySlug, ...product } of products) {
    const categoryId = categoryMap.get(categorySlug);
    if (!categoryId) throw new Error(`Unknown category: ${categorySlug}`);

    await prisma.product.create({
      data: {
        ...product,
        categoryId,
        imageUrl: `/products/${product.slug}.png`,
      },
    });
  }

  console.log(
    `Seeded ${categories.length} categories and ${products.length} products.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
