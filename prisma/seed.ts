import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const categories = [
  { slug: "qurilish-texnikasi", name: "Qurilish texnikasi", icon: "🏗️", sortOrder: 1 },
  { slug: "gidravlik-uskunalar", name: "Gidravlik uskunalar", icon: "🔧", sortOrder: 2 },
  { slug: "klining-uskunalari", name: "Klining uskunalari", icon: "🧹", sortOrder: 3 },
  { slug: "bog-texnikasi", name: "Bog' texnikasi", icon: "🌿", sortOrder: 4 },
];

const products = [
  // Qurilish texnikasi
  {
    slug: "betonomeshalka-200l",
    name: "Betonomeshalka 200 litr, 220V",
    description:
      "Kichik va o'rta hajmdagi qurilish ishlari uchun betonomeshalka. Hajmi 200 litr, elektr dvigatel bilan ishlaydi, ishonchli aralashtirish tizimi.",
    price: 4200000,
    categorySlug: "qurilish-texnikasi",
    rating: 4.5,
    reviewCount: 34,
    soldCount: 58,
    isFeatured: true,
    stock: 12,
  },
  {
    slug: "betonomeshalka-500l",
    name: "Betonomeshalka 500 litr, dizel",
    description:
      "Katta hajmdagi qurilish obyektlari uchun professional betonomeshalka. Dizel dvigatel, mustahkam ramka, yuqori unumdorlik.",
    price: 12500000,
    oldPrice: 14000000,
    categorySlug: "qurilish-texnikasi",
    rating: 4.6,
    reviewCount: 19,
    soldCount: 27,
    stock: 5,
  },
  {
    slug: "vibroplita-hcd90",
    name: "Vibroplita HCD90, 90 kg",
    description:
      "Yo'l va maydonchalarni zichlash uchun benzinli vibroplita. Og'irligi 90 kg, zichlash kuchi yuqori, boshqarish qulay.",
    price: 8900000,
    categorySlug: "qurilish-texnikasi",
    rating: 4.4,
    reviewCount: 22,
    soldCount: 31,
    stock: 8,
  },
  {
    slug: "generator-diesel-5kvt",
    name: "Dizel generator 5 kVt",
    description:
      "Qurilish maydonchalari uchun avtonom quvvat manbai. Uzluksiz ishlash rejimi, past yoqilg'i sarfi, tashqi muhitga chidamli korpus.",
    price: 9800000,
    categorySlug: "qurilish-texnikasi",
    rating: 4.7,
    reviewCount: 41,
    soldCount: 63,
    isFeatured: true,
    stock: 15,
  },
  {
    slug: "perforator-bosch-gbh",
    name: "Perforator Bosch GBH 2-26",
    description:
      "Beton va g'ishtni teshish uchun professional perforator. 3 rejim (urish, burg'ulash, patronsiz urish), SDS-plus patron.",
    price: 1850000,
    categorySlug: "qurilish-texnikasi",
    rating: 4.8,
    reviewCount: 87,
    soldCount: 210,
    stock: 34,
  },
  {
    slug: "ugloshlifmashina-bolgarka-230",
    name: "Burchak silliqlagich (bolgarka) 230mm",
    description:
      "Metall va tosh materiallarni kesish, silliqlash uchun quvvatli burchak silliqlagich. Disk diametri 230mm, himoya qopqog'i bilan.",
    price: 890000,
    categorySlug: "qurilish-texnikasi",
    rating: 4.5,
    reviewCount: 56,
    soldCount: 145,
    stock: 40,
  },
  {
    slug: "stroitelnye-lesa-komplekt",
    name: "Qurilish tirgovuchlari (lesa) to'plami",
    description:
      "Fasad va ichki ishlar uchun yig'iladigan metall tirgovuchlar to'plami. Mustahkam, tez yig'iladi, yuqori yuk ko'tarish qobiliyati.",
    price: 6500000,
    categorySlug: "qurilish-texnikasi",
    rating: 4.3,
    reviewCount: 15,
    soldCount: 22,
    stock: 6,
  },
  {
    slug: "svarochny-apparat-invertor",
    name: "Payvandlash apparati (invertor), 250A",
    description:
      "Kompakt va quvvatli invertor payvandlash apparati. Qurilish va ta'mirlash ishlarida metall konstruksiyalarni payvandlash uchun.",
    price: 2100000,
    oldPrice: 2450000,
    categorySlug: "qurilish-texnikasi",
    rating: 4.6,
    reviewCount: 48,
    soldCount: 98,
    stock: 20,
  },
  {
    slug: "kompressor-vozdushny-100l",
    name: "Havo kompressori, 100 litr",
    description:
      "Pnevmatik asboblar bilan ishlash uchun havo kompressori. Sig'imi 100 litr, yuqori bosim, uzluksiz ish rejimi.",
    price: 3600000,
    categorySlug: "qurilish-texnikasi",
    rating: 4.4,
    reviewCount: 29,
    soldCount: 44,
    stock: 10,
  },

  // Gidravlik uskunalar
  {
    slug: "gidravlichesky-domkrat-20t",
    name: "Gidravlik domkrat 20 tonna",
    description:
      "Og'ir yuk texnikasi va sanoat uskunalarini ko'tarish uchun gidravlik domkrat. Yuk ko'tarish qobiliyati 20 tonna, mustahkam korpus.",
    price: 1450000,
    categorySlug: "gidravlik-uskunalar",
    rating: 4.6,
    reviewCount: 33,
    soldCount: 52,
    stock: 18,
  },
  {
    slug: "gidronasos-shesterenny",
    name: "Gidronasos (tishli), NSh-32",
    description:
      "Traktor va maxsus texnika uchun tishli gidronasos. Yuqori ishonchlilik, barqaror bosim, uzoq xizmat muddati.",
    price: 2300000,
    categorySlug: "gidravlik-uskunalar",
    rating: 4.5,
    reviewCount: 26,
    soldCount: 38,
    isFeatured: true,
    stock: 14,
  },
  {
    slug: "gidroraspredelitel-4sekc",
    name: "Gidrotaqsimlagich, 4 seksiyali",
    description:
      "Gidravlik tizimlarda suyuqlik oqimini boshqarish uchun 4 seksiyali taqsimlagich. Ekskavator va yuk mashinalarida qo'llaniladi.",
    price: 3200000,
    categorySlug: "gidravlik-uskunalar",
    rating: 4.4,
    reviewCount: 18,
    soldCount: 25,
    stock: 9,
  },
  {
    slug: "gidrocilindr-teleskop",
    name: "Gidrosilindr (teleskopik), 4 bosqichli",
    description:
      "Samosval va maxsus texnika uchun teleskopik gidrosilindr. 4 bosqichli, yuqori bosimga chidamli, uzun xizmat muddati.",
    price: 5400000,
    categorySlug: "gidravlik-uskunalar",
    rating: 4.5,
    reviewCount: 21,
    soldCount: 29,
    stock: 7,
  },
  {
    slug: "gidravlichesky-press-30t",
    name: "Gidravlik pres, 30 tonna",
    description:
      "Ustaxona va ishlab chiqarish uchun gidravlik pres. Bosim kuchi 30 tonna, metall qismlarni to'g'irlash va shakllantirish uchun.",
    price: 7800000,
    oldPrice: 8900000,
    categorySlug: "gidravlik-uskunalar",
    rating: 4.7,
    reviewCount: 24,
    soldCount: 33,
    stock: 6,
  },
  {
    slug: "rukav-vysokogo-davleniya",
    name: "Yuqori bosimli gidravlik shlang, 10m",
    description:
      "Gidravlik tizimlar uchun mustahkam yuqori bosimli shlang. Uzunligi 10 metr, metall armaturali, yuqori bosimga chidamli.",
    price: 680000,
    categorySlug: "gidravlik-uskunalar",
    rating: 4.3,
    reviewCount: 42,
    soldCount: 76,
    stock: 25,
  },
  {
    slug: "gidrostanciya-mobilnaya",
    name: "Mobil gidrostansiya, 380V",
    description:
      "Ko'chma gidravlik quvvat stansiyasi. Turli gidravlik asboblarni ishga tushirish uchun, ishonchli va samarali.",
    price: 15800000,
    categorySlug: "gidravlik-uskunalar",
    rating: 4.6,
    reviewCount: 12,
    soldCount: 17,
    stock: 3,
  },

  // Klining uskunalari
  {
    slug: "moyka-vysokogo-davleniya-karcher",
    name: "Yuqori bosimli yuvish moslamasi (Karcher tipi)",
    description:
      "Avtomobil, fasad va maydonchalarni tozalash uchun yuqori bosimli yuvish moslamasi. Kuchli bosim, qulay boshqaruv.",
    price: 2450000,
    categorySlug: "klining-uskunalari",
    rating: 4.7,
    reviewCount: 68,
    soldCount: 134,
    isFeatured: true,
    stock: 22,
  },
  {
    slug: "parogenerator-promyshlenny",
    name: "Sanoat bug' generatori",
    description:
      "Chuqur tozalash uchun professional bug' generatori. Kimyoviy vositasiz gigienik tozalash, restoran va mehmonxonalar uchun ideal.",
    price: 3900000,
    categorySlug: "klining-uskunalari",
    rating: 4.5,
    reviewCount: 27,
    soldCount: 39,
    stock: 11,
  },
  {
    slug: "pylesos-promyshlenny-vodopyl",
    name: "Sanoat changyutgichi (quruq/ho'l)",
    description:
      "Ofis, ombor va ishlab chiqarish maydonlarini tozalash uchun kuchli sanoat changyutgichi. Ham quruq, ham ho'l tozalash rejimi.",
    price: 1980000,
    categorySlug: "klining-uskunalari",
    rating: 4.6,
    reviewCount: 45,
    soldCount: 87,
    stock: 19,
  },
  {
    slug: "polotermash-odnodiskovaya",
    name: "Pol yuvish-siyllatish mashinasi (bir diskli)",
    description:
      "Katta maydonli pollarni yuvish va silliqlash uchun professional mashina. Ofis binolari, savdo markazlari uchun mos.",
    price: 4600000,
    categorySlug: "klining-uskunalari",
    rating: 4.4,
    reviewCount: 16,
    soldCount: 23,
    stock: 8,
  },
  {
    slug: "kartrigi-filtry-dlya-pylesosa",
    name: "Sanoat changyutgichi uchun filtr to'plami",
    description:
      "Sanoat changyutgichlari uchun almashtiriladigan HEPA filtr to'plami. Yuqori changni tutish samaradorligi.",
    price: 280000,
    categorySlug: "klining-uskunalari",
    rating: 4.3,
    reviewCount: 38,
    soldCount: 112,
    stock: 60,
  },
  {
    slug: "moyushiy-pylesos-ekstraktor",
    name: "Yuvish-ekstraktor changyutgichi",
    description:
      "Gilam va yumshoq mebelni chuqur tozalash uchun yuvish-ekstraktor turi changyutgich. Suv purkash va so'rish funksiyasi birlashgan.",
    price: 5200000,
    oldPrice: 5900000,
    categorySlug: "klining-uskunalari",
    rating: 4.5,
    reviewCount: 21,
    soldCount: 28,
    stock: 7,
  },

  // Bog' texnikasi
  {
    slug: "gazonokosilka-benzin-samohodnaya",
    name: "Benzinli o'z yurar gazonokosilka",
    description:
      "Katta maydonli gazonlarni parvarish qilish uchun o'z yurar gazonokosilka. Kesish kengligi keng, quvvatli dvigatel.",
    price: 4800000,
    categorySlug: "bog-texnikasi",
    rating: 4.6,
    reviewCount: 39,
    soldCount: 61,
    isFeatured: true,
    stock: 16,
  },
  {
    slug: "trimmer-benzinovy-sadovy",
    name: "Benzinli bog' trimmeri (o'roq)",
    description:
      "O't va butazorlarni kesish uchun qulay va yengil benzinli trimmer. Qiyin joylarda ham samarali ishlaydi.",
    price: 1650000,
    categorySlug: "bog-texnikasi",
    rating: 4.5,
    reviewCount: 54,
    soldCount: 103,
    stock: 28,
  },
  {
    slug: "motoblok-benzinovy",
    name: "Benzinli motoblok",
    description:
      "Yer haydash, urug' ekish va boshqa dala ishlari uchun universal motoblok. Turli qo'shimcha jihozlar bilan mos.",
    price: 9200000,
    categorySlug: "bog-texnikasi",
    rating: 4.4,
    reviewCount: 23,
    soldCount: 34,
    stock: 9,
  },
  {
    slug: "kustorez-akkumulyatorny",
    name: "Akkumulyatorli buta kesgich",
    description:
      "Bog' va shiplarni tekis kesish uchun simsiz, akkumulyatorli buta kesgich. Yengil, shovqinsiz, ishlatish qulay.",
    price: 1250000,
    categorySlug: "bog-texnikasi",
    rating: 4.5,
    reviewCount: 31,
    soldCount: 48,
    stock: 20,
  },
  {
    slug: "motopompa-dlya-poliva",
    name: "Sug'orish uchun motopompa",
    description:
      "Bog' va dalalarni sug'orish uchun benzinli motopompa. Yuqori unumdorlik, uzoq quvurlarga suv uzata oladi.",
    price: 2850000,
    categorySlug: "bog-texnikasi",
    rating: 4.6,
    reviewCount: 28,
    soldCount: 42,
    stock: 12,
  },
  {
    slug: "cepnaya-pila-benzin",
    name: "Benzinli zanjirli arra",
    description:
      "Daraxtlarni kesish va yog'och tayyorlash uchun quvvatli zanjirli arra. Xavfsizlik tormozi, qulay tutqich.",
    price: 2100000,
    oldPrice: 2400000,
    categorySlug: "bog-texnikasi",
    rating: 4.7,
    reviewCount: 47,
    soldCount: 79,
    stock: 17,
  },
  {
    slug: "opryskivatel-sadovy-16l",
    name: "Bog' purkagichi, 16 litr",
    description:
      "O'simliklarni himoya qilish vositalari bilan ishlov berish uchun orqaga osiladigan purkagich. Sig'imi 16 litr, qulay nasos.",
    price: 340000,
    categorySlug: "bog-texnikasi",
    rating: 4.3,
    reviewCount: 62,
    soldCount: 158,
    stock: 45,
  },
  {
    slug: "snegouborshik-benzinovy",
    name: "Benzinli qor tozalagich",
    description:
      "Hovli va yo'lkalardagi qorni tez va samarali tozalash uchun benzinli qor tozalagich. Qishki mavsum uchun zarur uskuna.",
    price: 8600000,
    categorySlug: "bog-texnikasi",
    rating: 4.4,
    reviewCount: 14,
    soldCount: 19,
    stock: 5,
  },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  const categoryMap = new Map(
    (await prisma.category.findMany()).map((c) => [c.slug, c.id])
  );

  for (const { categorySlug, ...product } of products) {
    const categoryId = categoryMap.get(categorySlug);
    if (!categoryId) throw new Error(`Unknown category: ${categorySlug}`);

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        ...product,
        categoryId,
        imageUrl: `/products/${product.slug}.jpg`,
      },
      create: {
        ...product,
        categoryId,
        imageUrl: `/products/${product.slug}.jpg`,
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
