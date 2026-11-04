// Seeds the new database with the catalogue copied from the live stratega.uz (28.10.2026).
// LOCAL databases only: re-running overwrites names, prices and photos of the seeded products and categories.
//   npm run db:seed
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

if (!/@(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//.test(process.env.DATABASE_URL ?? "")) {
  console.error("Refusing to seed: DATABASE_URL does not point to a local database. Seeding would overwrite real catalogue data.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const CATEGORIES = [
  {
    slug: "elektr-shtabelerlar",
    name: "Elektr shtabelerlar",
    nameRu: "Электрические штабелёры",
    nameEn: "Electric stackers",
    icon: "🏗️",
    sortOrder: 1,
    description:
      "Elektr shtabelerlar (yarim avtomat va avtomat, o'z yurar), yuk ko'tarish qobiliyati 2 tonna, ko'tarish balandligi 1.6–4.5 m. Omborlar, ishlab chiqarish va logistika markazlari uchun. Narxlar QQS bilan, Toshkentda omborda.",
    descriptionRu:
      "Электрические штабелёры (полуавтоматические и самоходные) грузоподъёмностью 2 т и высотой подъёма 1,6–4,5 м. Для складов, производств и логистических центров. Цены с НДС, в наличии на складе в Ташкенте.",
    descriptionEn:
      "Electric stackers (semi-automatic and self-propelled), 2 t capacity, 1.6–4.5 m lift height. For warehouses, production and logistics centres. Prices incl. VAT, in stock in Tashkent.",
  },
  {
    slug: "gidravlik-telejkalar",
    name: "Gidravlik telejkalar",
    nameRu: "Гидравлические тележки",
    nameEn: "Hydraulic pallet trucks",
    icon: "🛠️",
    sortOrder: 2,
    description:
      "Gidravlik telejkalar (rohlya) 3 tonna: oddiy, tarozili va rulon uchun, hamda qo'l gidravlik shtabeler. Ombor va do'konlar uchun. Narxlar QQS bilan.",
    descriptionRu:
      "Гидравлические тележки (рохли, транспалеты) на 3 т: стандартные, с весами и для рулонов, а также ручной гидравлический штабелёр. Для складов и магазинов. Цены с НДС.",
    descriptionEn:
      "3-tonne hydraulic pallet trucks: standard, with scale and for rolls, plus a manual hydraulic stacker. For warehouses and shops. Prices incl. VAT.",
  },
  {
    slug: "payvandlash-apparatlari",
    name: "PE (PND) quvur payvandlash apparatlari",
    nameRu: "Аппараты для сварки ПНД труб",
    nameEn: "PE pipe welding machines",
    icon: "🔥",
    sortOrder: 3,
    description:
      "PE, PND va HDPE quvurlarni uchma-uch payvandlash (stykovka) apparatlari 63–630 mm — qo'l va gidravlik modellar, hamda PPR quvurlar uchun payka. Suv, gaz va kanalizatsiya tarmoqlari montaji uchun. Narxlar QQS bilan.",
    descriptionRu:
      "Аппараты стыковой сварки ПНД (PE, HDPE) труб диаметром 63–630 мм — ручные и гидравлические, а также паяльники для PPR. Для монтажа водопровода, газопровода и канализации. Цены с НДС.",
    descriptionEn:
      "Butt-fusion welding machines for PE/HDPE pipes 63–630 mm (manual and hydraulic) and PPR socket welders. For water, gas and sewer networks. Prices incl. VAT.",
  },
];

type Seed = {
  slug: string;
  category: string;
  name: string;
  nameRu: string;
  nameEn: string;
  description: string;
  descriptionRu: string;
  descriptionEn: string;
  price: number;
  oldPrice?: number;
  costPrice?: number;
  sku?: string;
  brand?: string;
  imageUrl?: string;
  isFeatured?: boolean;
  stock: number;
  priceUsd?: number;
};

const STACKERS: Seed[] = [
  {
    slug: "shtabeler-elektr-avtomat-35m",
    category: "elektr-shtabelerlar",
    name: "Elektr shtabeler (avtomat), 2T / 3.5m",
    nameRu: "Электрический штабелёр (автомат), 2Т / 3.5м",
    nameEn: "Electric stacker (automatic), 2T / 3.5m",
    description:
      "To'liq avtomatik boshqaruvli elektr shtabeler. Yuk ko'tarish qobiliyati 2 tonna, ko'tarish balandligi 3.5 metr. Mustahkam va ishonchli konstruksiya, omborlar va logistika markazlari uchun.",
    descriptionRu:
      "Электрический штабелёр с полностью автоматическим управлением. Грузоподъёмность 2 тонны, высота подъёма 3.5 метра. Прочная и надёжная конструкция для складов и логистических центров.",
    descriptionEn:
      "Fully automatic electric stacker. Load capacity 2 tons, lift height 3.5 meters. Sturdy, reliable construction for warehouses and logistics centers.",
    price: 37500000,
    imageUrl: "/products/shtabeler-elektr-avtomat-35m.png",
    isFeatured: true,
    stock: 6,
  },
  {
    slug: "shtabeler-elektr-avtomat-45m",
    category: "elektr-shtabelerlar",
    name: "Elektr shtabeler (avtomat, o'z yurar), 2T / 4.5m",
    nameRu: "Электрический штабелёр (самоходный, автомат), 2Т / 4.5м",
    nameEn: "Electric stacker (self-propelled, automatic), 2T / 4.5m",
    description:
      "O'z yurar (samoxod) elektr shtabeler, kuchaytirilgan konstruksiya. Yuk ko'tarish qobiliyati 2 tonna, ko'tarish balandligi 4.5 metr — baland stellajli omborlar uchun.",
    descriptionRu:
      "Самоходный электрический штабелёр с усиленной конструкцией. Грузоподъёмность 2 тонны, высота подъёма 4.5 метра — для складов с высокими стеллажами.",
    descriptionEn:
      "Self-propelled electric stacker with a reinforced construction. Load capacity 2 tons, lift height 4.5 meters — for warehouses with high racking.",
    price: 44800000,
    imageUrl: "/products/shtabeler-elektr-avtomat-45m.png",
    isFeatured: true,
    stock: 3,
  },
  {
    slug: "shtabeler-elektr-poluavtomat-3m",
    category: "elektr-shtabelerlar",
    name: "Elektr shtabeler (yarim avtomat), 2T / 3m",
    nameRu: "Электрический штабелёр (полуавтомат), 2Т / 3м",
    nameEn: "Electric stacker (semi-automatic), 2T / 3m",
    description:
      "Yarim avtomatik boshqaruvli elektr shtabeler. Yuk ko'tarish qobiliyati 2 tonna, ko'tarish balandligi 3 metr. Qulay narxda samarali yechim.",
    descriptionRu:
      "Электрический штабелёр с полуавтоматическим управлением. Грузоподъёмность 2 тонны, высота подъёма 3 метра. Эффективное решение по доступной цене.",
    descriptionEn: "Semi-automatic electric stacker. Load capacity 2 tons, lift height 3 meters. An efficient solution at an affordable price.",
    price: 19710000,
    imageUrl: "/products/shtabeler-elektr-poluavtomat-3m.png",
    stock: 8,
  },
  {
    slug: "shtabeler-elektr-poluavtomat-16m",
    category: "elektr-shtabelerlar",
    name: "Elektr shtabeler (yarim avtomat), 2T / 1.6m",
    nameRu: "Электрический штабелёр (полуавтомат), 2Т / 1.6м",
    nameEn: "Electric stacker (semi-automatic), 2T / 1.6m",
    description:
      "Kompakt yarim avtomatik elektr shtabeler. Yuk ko'tarish qobiliyati 2 tonna, ko'tarish balandligi 1.6 metr. Tor joylar va kichik omborlar uchun qulay.",
    descriptionRu:
      "Компактный полуавтоматический электрический штабелёр. Грузоподъёмность 2 тонны, высота подъёма 1.6 метра. Удобен для узких проходов и небольших складов.",
    descriptionEn: "Compact semi-automatic electric stacker. Load capacity 2 tons, lift height 1.6 meters. Convenient for narrow aisles and small warehouses.",
    price: 16900000,
    imageUrl: "/products/shtabeler-elektr-poluavtomat-16m.png",
    stock: 7,
  },
  {
    slug: "shtabeler-gidravlik-qolda-16m",
    category: "gidravlik-telejkalar",
    name: "Qo'l gidravlik shtabeler, 2T / 1.60m",
    nameRu: "Ручной гидравлический штабелёр, 2Т / 1.60м",
    nameEn: "Manual hydraulic stacker, 2T / 1.60m",
    description:
      "Qo'lda boshqariladigan gidravlik shtabeler. Yuk ko'tarish qobiliyati 2 tonna, ko'tarish balandligi 1.60 metr. Elektr manbasiz ishlaydi.",
    descriptionRu:
      "Гидравлический штабелёр с ручным управлением. Грузоподъёмность 2 тонны, высота подъёма 1.60 метра. Работает без электричества.",
    descriptionEn: "Manually operated hydraulic stacker. Load capacity 2 tons, lift height 1.60 meters. Works without electricity.",
    price: 9220000,
    imageUrl: "/products/shtabeler-gidravlik-qolda-16m.png",
    isFeatured: true,
    stock: 10,
  },
  {
    slug: "telejka-gidravlik-rulon-180sm",
    category: "gidravlik-telejkalar",
    name: "Gidravlik telejka rulon uchun, 3T / 180sm",
    nameRu: "Гидравлическая тележка для рулонов, 3Т / 180см",
    nameEn: "Hydraulic pallet truck for rolls, 3T / 180cm",
    description:
      "Rulon materiallarni tashish uchun maxsus konstruksiyali gidravlik telejka. Yuk ko'tarish qobiliyati 3 tonna, vilka uzunligi 180 sm.",
    descriptionRu: "Гидравлическая тележка специальной конструкции для рулонных материалов. Грузоподъёмность 3 тонны, длина вил 180 см.",
    descriptionEn: "Specially designed hydraulic pallet truck for rolled materials. Load capacity 3 tons, fork length 180 cm.",
    price: 8320000,
    imageUrl: "/products/telejka-gidravlik-rulon-180sm.png",
    stock: 12,
  },
  {
    slug: "telejka-gidravlik-tarozili",
    category: "gidravlik-telejkalar",
    name: "Gidravlik telejka elektron tarozi bilan, 3T",
    nameRu: "Гидравлическая тележка с электронными весами, 3Т",
    nameEn: "Hydraulic pallet truck with electronic scale, 3T",
    description: "Elektron tarozi bilan jihozlangan gidravlik telejka. Yuk ko'tarish qobiliyati 3 tonna, tashish paytida yuk vaznini o'lchash imkoniyati.",
    descriptionRu: "Гидравлическая тележка с электронными весами. Грузоподъёмность 3 тонны, взвешивание груза в процессе перемещения.",
    descriptionEn: "Hydraulic pallet truck with an electronic scale. Load capacity 3 tons, weighs the load while moving it.",
    price: 5760000,
    oldPrice: 6400000,
    imageUrl: "/products/telejka-gidravlik-tarozili.png",
    isFeatured: true,
    stock: 9,
  },
  {
    slug: "telejka-gidravlik-standart-120sm",
    category: "gidravlik-telejkalar",
    name: "Gidravlik telejka (rohlya), 3T / 120sm",
    nameRu: "Гидравлическая тележка (рохля), 3Т / 120см",
    nameEn: "Hydraulic pallet truck, 3T / 120cm",
    description: "Standart qo'l gidravlik telejka (rohlya). Yuk ko'tarish qobiliyati 3 tonna, vilka uzunligi 120 sm. Ombor va do'konlar uchun.",
    descriptionRu: "Стандартная ручная гидравлическая тележка (рохля). Грузоподъёмность 3 тонны, длина вил 120 см. Для складов и магазинов.",
    descriptionEn: "Standard manual hydraulic pallet truck. Load capacity 3 tons, fork length 120 cm. For warehouses and shops.",
    price: 1920000,
    imageUrl: "/products/telejka-gidravlik-standart-120sm.png",
    stock: 20,
  },
];

function welder(o: {
  slug: string;
  sku: string;
  range: string;
  hydraulic: boolean;
  price: number;
  costPrice: number;
  stock: number;
  priceUsd: number;
}): Seed {
  const h = o.hydraulic;
  return {
    slug: o.slug,
    category: "payvandlash-apparatlari",
    sku: o.sku,
    brand: "TURAN",
    name: `${h ? "Gidravlik" : "Polietilen"} quvur payvandlash apparati TURAN ${o.sku} (${o.range} mm)`,
    nameRu: `${h ? "Гидравлический аппарат" : "Аппарат"} для стыковой сварки ПНД труб TURAN ${o.sku} (${o.range} мм)`,
    nameEn: `${h ? "Hydraulic b" : "B"}utt-fusion welding machine for PE pipes TURAN ${o.sku} (${o.range} mm)`,
    description:
      `TURAN ${o.sku} — PE (PND, HDPE) va PP quvurlarni uchma-uch payvandlash (stykovka) uchun ${h ? "gidravlik " : ""}apparat (payka, dazmol). Payvandlanadigan quvur diametri: ${o.range} mm.\n\n` +
      "Suv ta'minoti, gaz quvurlari, kanalizatsiya va sug'orish tarmoqlarini montaj qilish uchun. Qurilish va montaj brigadalari, pudratchilar uchun.\n\n" +
      "Narx QQS bilan; hisob-faktura, shartnoma va to'liq hujjatlar beriladi.",
    descriptionRu:
      `${h ? "Гидравлический аппарат" : "Аппарат"} для стыковой сварки полиэтиленовых труб ПНД (PE, HDPE) и PP TURAN ${o.sku}. Диаметр свариваемых труб: ${o.range} мм. В народе — «пайка» или «утюг» для ПНД труб.\n\n` +
      "Для монтажа водопровода, газопровода, канализации и систем орошения. Подходит строительным и монтажным бригадам, подрядчикам.\n\n" +
      "Цена с НДС; счёт-фактура, договор и полный пакет документов.",
    descriptionEn:
      `TURAN ${o.sku} ${h ? "hydraulic " : ""}butt-fusion welding machine for PE (HDPE) and PP pipes. Pipe diameter range: ${o.range} mm.\n\n` +
      "For installing water, gas, sewer and irrigation networks. Suited to construction and installation crews and contractors.\n\n" +
      "Price incl. VAT; VAT invoice, contract and full document package provided.",
    price: o.price,
    costPrice: o.costPrice,
    stock: o.stock,
    priceUsd: o.priceUsd,
  };
}

const WELDERS: Seed[] = [
  welder({ slug: "polietilen-quvur-payvandlash-apparati-turan-cn-63200-63200-mm", sku: "CN-63/200", range: "63–200", hydraulic: false, price: 3600000, costPrice: 2091910, stock: 20, priceUsd: 146.5 }),
  welder({ slug: "polietilen-quvur-payvandlash-apparati-turan-cn-63250-63250-mm", sku: "CN-63/250", range: "63–250", hydraulic: false, price: 6000000, costPrice: 3923962, stock: 5, priceUsd: 280 }),
  welder({ slug: "gidravlik-quvur-payvandlash-apparati-turan-cn-90315h-90315-mm", sku: "CN-90/315H", range: "90–315", hydraulic: true, price: 18000000, costPrice: 10523807, stock: 16, priceUsd: 737 }),
  welder({ slug: "gidravlik-quvur-payvandlash-apparati-turan-cn-160450h-160450-mm", sku: "CN-160/450H", range: "160–450", hydraulic: true, price: 36000000, costPrice: 20704913, stock: 5, priceUsd: 1450 }),
  welder({ slug: "gidravlik-quvur-payvandlash-apparati-turan-cn-160500h-160500-mm", sku: "CN-160/500H", range: "160–500", hydraulic: true, price: 40000000, costPrice: 25774046, stock: 5, priceUsd: 1805 }),
  welder({ slug: "gidravlik-quvur-payvandlash-apparati-turan-cn-315630h-315630-mm", sku: "CN-315/630H", range: "315–630", hydraulic: true, price: 66000000, costPrice: 32413898, stock: 4, priceUsd: 2270 }),
  {
    slug: "ppr-quvur-payvandlash-apparati-cn-026-2063-mm",
    category: "payvandlash-apparatlari",
    sku: "CN-026",
    name: "PPR quvur payvandlash apparati CN-026 (20–63 mm)",
    nameRu: "Аппарат для сварки полипропиленовых (PPR) труб CN-026 (20–63 мм)",
    nameEn: "PPR pipe socket welder CN-026 (20–63 mm)",
    description:
      "CN-026 — polipropilen (PPR) quvurlarni payvandlash apparati (payka, dazmol). Quvur diametri: 20–63 mm.\n\nUy va binolarda suv ta'minoti hamda isitish tizimlarini montaj qilish uchun. Santexniklar va montaj brigadalari uchun.\n\nNarx QQS bilan.",
    descriptionRu:
      "Аппарат для сварки полипропиленовых труб (PPR) CN-026, паяльник для труб. Диаметр труб: 20–63 мм.\n\nДля монтажа водопровода и отопления в домах и зданиях. Подходит сантехникам и монтажным бригадам.\n\nЦена с НДС.",
    descriptionEn:
      "CN-026 socket welder for polypropylene (PPR) pipes. Pipe diameter: 20–63 mm.\n\nFor installing water supply and heating systems in homes and buildings.\n\nPrice incl. VAT.",
    price: 500000,
    costPrice: 107094,
    stock: 20,
    priceUsd: 7.5,
  },
];

async function main() {
  console.log("Seeding categories…");
  const catIds = new Map<string, string>();
  for (const c of CATEGORIES) {
    const row = await prisma.category.upsert({ where: { slug: c.slug }, update: c, create: c });
    catIds.set(c.slug, row.id);
  }

  const warehouse = await prisma.warehouse.upsert({
    where: { code: "MAIN" },
    update: {},
    create: { name: "Asosiy ombor", code: "MAIN", address: "Toshkent", isDefault: true },
  });

  const chaoneng = await prisma.supplier.upsert({
    where: { id: "seed-supplier-chaoneng" },
    update: {},
    create: {
      id: "seed-supplier-chaoneng",
      name: "Chaoneng (TURAN)",
      legalName: "ZHUJI CIWU CHAONENG ELECTRICAL EQUIPMENT",
      country: "China",
      note: "TURAN butt-fusion welders. Terms: 30% prepayment, balance within 45 days.",
    },
  });
  const niuli = await prisma.supplier.upsert({
    where: { id: "seed-supplier-niuli" },
    update: {},
    create: { id: "seed-supplier-niuli", name: "Niuli Machinery", country: "China", note: "Stackers and pallet trucks." },
  });

  console.log("Seeding products and opening stock…");
  for (const p of [...STACKERS, ...WELDERS]) {
    const { category, stock, priceUsd, ...data } = p;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: { ...data, categoryId: catIds.get(category)! },
      create: { ...data, categoryId: catIds.get(category)!, stock: 0 },
    });

    const level = await prisma.stockLevel.findUnique({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
    });
    if (!level) {
      await prisma.$transaction([
        prisma.stockLevel.create({ data: { productId: product.id, warehouseId: warehouse.id, quantity: stock } }),
        prisma.stockMove.create({
          data: {
            productId: product.id,
            warehouseId: warehouse.id,
            delta: stock,
            balanceAfter: stock,
            reason: "OPENING",
            note: "Boshlang'ich qoldiq (stratega.uz, 28.10.2026)",
            actor: "seed",
          },
        }),
        prisma.product.update({ where: { id: product.id }, data: { stock } }),
      ]);
    }

    const supplierId = p.category === "payvandlash-apparatlari" ? chaoneng.id : niuli.id;
    await prisma.productSupplier.upsert({
      where: { productId_supplierId: { productId: product.id, supplierId } },
      update: { priceUsd: priceUsd ?? null },
      create: { productId: product.id, supplierId, priceUsd: priceUsd ?? null, supplierSku: p.sku ?? null },
    });
  }

  await prisma.priceList.upsert({
    where: { code: "RETAIL" },
    update: {},
    create: { name: "Chakana (sayt narxi)", code: "RETAIL", note: "Bo'sh qolgan mahsulotlar sayt narxi bo'yicha." },
  });

  const defaults: Record<string, unknown> = {
    "stock.lowStockThreshold": 2,
    "stock.overstockMultiplier": 6,
    "forecast.lookbackDays": 90,
    "finance.paymentOverdueDays": 45,
    "company.name": "OOO «STRATEGA»",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value: value as never } });
  }

  const email = process.env.SEED_OWNER_EMAIL;
  const password = process.env.SEED_OWNER_PASSWORD;
  if (email && password) {
    await prisma.employee.upsert({
      where: { email },
      update: {},
      create: { email, name: process.env.SEED_OWNER_NAME ?? "Owner", role: "OWNER", passwordHash: hashPassword(password) },
    });
    console.log(`Owner account: ${email}`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
