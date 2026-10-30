/**
 * Puts the main directions first in the catalogue and fills in what the focus categories need.
 *
 *   DATABASE_URL=... npm run seed:focus            # dry run: prints what would change
 *   DATABASE_URL=... npm run seed:focus -- --apply # writes
 *
 * Safe to re-run. It never overwrites text you have written:
 *  - creates the focus categories that do not exist yet (rigging & lifting, etc.);
 *  - fills category names (ru/en), icon and the SEO text only where they are empty;
 *  - orders categories: focus categories in direction order, everything else after them;
 *  - fills the filter fields (capacity, lift height, working width, power) from product names
 *    only where they are empty, using clear patterns ("2,5 t", "530 mm", "5 kVt", "7 o.k.").
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { FOCUS_CATEGORY_ORDER } from "../src/lib/focus";
import { specsFromName, type SpecField } from "../src/lib/product-specs";

const APPLY = process.argv.includes("--apply");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

type Cat = { name: string; nameRu: string; nameEn: string; icon: string; uz: string; ru: string };

export const FOCUS_CATEGORIES: Record<string, Cat> = {
  "gidravlik-telejkalar": {
    name: "Gidravlik telejkalar (rohlya)", nameRu: "Гидравлические тележки (рохли)", nameEn: "Hand pallet trucks", icon: "🛒",
    uz: "Gidravlik telejka (rohlya) 2–5 tonna: standart, tarozili, rulon va past profilli modellar. Rohlya narxi QQS bilan, Toshkentdagi ombordan va buyurtma asosida. G'ildirak va gidravlika uchun ehtiyot qismlar bor.",
    ru: "Гидравлические тележки (рохли) на 2–5 тонн: стандартные, с весами, для рулонов и низкопрофильные. Цена рохли с НДС, со склада в Ташкенте и под заказ. Есть запчасти — колёса и гидравлика.",
  },
  "elektr-telejkalar": {
    name: "Elektr telejkalar", nameRu: "Электрические тележки", nameEn: "Electric pallet trucks", icon: "🔋",
    uz: "Elektr telejkalar (elektr rohlya) 1,5–3 tonna, litiy va kislotali akkumulyator bilan. Katta omborlar va logistika markazlari uchun. Narxlar QQS bilan, yuridik shaxslar uchun shartnoma.",
    ru: "Электрические тележки (электророхли) 1,5–3 т с литиевыми и кислотными АКБ — для больших складов и логистических центров. Цены с НДС, договор для юрлиц.",
  },
  "qol-shtabelerlari": {
    name: "Qo'l shtabelerlari", nameRu: "Ручные штабелеры", nameEn: "Manual stackers", icon: "🏗️",
    uz: "Qo'l gidravlik shtabelerlar 0,5–2 tonna, ko'tarish balandligi 1,6–3 m. Kichik omborlar va do'konlar uchun arzon yechim. Shtabeler narxi QQS bilan.",
    ru: "Ручные гидравлические штабелеры 0,5–2 т с высотой подъёма 1,6–3 м — недорогое решение для небольших складов и магазинов. Цена штабелера с НДС.",
  },
  "elektr-shtabelerlar": {
    name: "Elektr shtabelerlar", nameRu: "Электрические штабелеры", nameEn: "Electric stackers", icon: "🏗️",
    uz: "Yarim elektr va to'liq elektr shtabelerlar 1–2 tonna, ko'tarish balandligi 1,6–5 m. Omborlar, ishlab chiqarish va logistika uchun. Narxlar QQS bilan, Toshkentda.",
    ru: "Полуэлектрические и электрические штабелеры 1–2 т с высотой подъёма 1,6–5 м для складов, производства и логистики. Цены с НДС, Ташкент.",
  },
  "pol-yuvish-mashinalari": {
    name: "Pol yuvish mashinalari", nameRu: "Поломоечные машины", nameEn: "Floor scrubbers", icon: "🧽",
    uz: "Akkumulyatorli va kabelli pol yuvish mashinalari, o'tirib boshqariladigan modellar — ishchi kenglik 330 mm dan 860 mm gacha. Savdo markazlari, omborlar va zavodlar uchun. Pol yuvish mashinasi narxi QQS bilan.",
    ru: "Аккумуляторные и сетевые поломоечные машины, модели с сиденьем — ширина уборки от 330 до 860 мм. Для торговых центров, складов и заводов. Цена поломоечной машины с НДС.",
  },
  "supurish-mashinalari": {
    name: "Supurish mashinalari", nameRu: "Подметальные машины", nameEn: "Sweepers", icon: "🧹",
    uz: "O'tirib boshqariladigan supurish mashinalari 1250–2000 mm — omborlar, zavod hududlari, avtoturargohlar uchun.",
    ru: "Подметальные машины с сиденьем оператора 1250–2000 мм — для складов, заводских территорий и парковок.",
  },
  "sanoat-changyutgichlari": {
    name: "Sanoat changyutgichlari", nameRu: "Промышленные пылесосы", nameEn: "Industrial vacuums", icon: "🌀",
    uz: "Ho'l va quruq tozalash uchun sanoat changyutgichlari 15–80 litr, 1–3 motorli. Avtomoyka, tozalash kompaniyalari va ishlab chiqarish uchun.",
    ru: "Промышленные пылесосы для влажной и сухой уборки 15–80 л, 1–3 мотора — для автомоек, клининга и производства.",
  },
  "payvandlash-apparatlari": {
    name: "PE quvur payvandlash apparatlari", nameRu: "Аппараты для сварки ПЭ труб", nameEn: "PE pipe welders", icon: "🔥",
    uz: "TURAN polietilen quvur payvandlash apparatlari: qo'l modellari 63–250 mm, gidravlik 90–630 mm. Quvur payvandlash apparati narxi QQS bilan, ehtiyot qismlar va tender hujjatlari.",
    ru: "Аппараты для сварки полиэтиленовых труб TURAN: ручные 63–250 мм, гидравлические 90–630 мм. Цена с НДС, запчасти и документы для тендеров.",
  },
  generatorlar: {
    name: "Generatorlar", nameRu: "Генераторы", nameEn: "Generators", icon: "⚡",
    uz: "Benzinli va dizel generatorlar 2,8–10 kVt, qo'l va elektr starterli. Qurilish, do'kon va uy uchun. Generator narxi QQS bilan.",
    ru: "Бензиновые и дизельные генераторы 2,8–10 кВт, с ручным и электростартером — для стройки, магазина и дома. Цена генератора с НДС.",
  },
  "invertorli-generatorlar": {
    name: "Invertorli generatorlar", nameRu: "Инверторные генераторы", nameEn: "Inverter generators", icon: "⚡",
    uz: "Shovqinsiz invertorli generatorlar — kompyuter, kassa va sezgir texnika uchun barqaror kuchlanish.",
    ru: "Тихие инверторные генераторы — стабильное напряжение для компьютеров, касс и чувствительной техники.",
  },
  "qol-zanjirli-tallar": {
    name: "Qo'l zanjirli tallar", nameRu: "Тали ручные цепные", nameEn: "Manual chain hoists", icon: "⛓️",
    uz: "Qo'l zanjirli (shesternali) tallar 0,5–10 tonna, ko'tarish balandligi 3–6 m. Ustaxona, ombor va qurilish uchun. Tal narxi QQS bilan.",
    ru: "Ручные цепные (шестерённые) тали 0,5–10 т с высотой подъёма 3–6 м — для мастерских, складов и стройки. Цена тали с НДС.",
  },
  "richagli-tallar": {
    name: "Richagli tallar", nameRu: "Тали рычажные", nameEn: "Lever hoists", icon: "⛓️",
    uz: "Richagli tallar 0,75–6 tonna — yukni tortish, tarang qilish va montaj ishlari uchun.",
    ru: "Рычажные тали 0,75–6 т — для подъёма, натяжения и монтажных работ.",
  },
  "elektr-tallar": {
    name: "Elektr tallar", nameRu: "Тали электрические", nameEn: "Electric hoists", icon: "⚙️",
    uz: "220 V elektr arqonli tallar 200–1200 kg va elektr zanjirli tallar 0,5–5 tonna. Ustaxona, ombor va ishlab chiqarish uchun.",
    ru: "Электрические канатные тали 220 В на 200–1200 кг и электрические цепные тали 0,5–5 т — для мастерских, складов и производства.",
  },
  "tal-aravachalari": {
    name: "Tal aravachalari", nameRu: "Тележки для талей", nameEn: "Hoist trolleys", icon: "🛤️",
    uz: "Qo'l tallari uchun aravachalar (koshka) 0,5–5 tonna — tavr balka bo'ylab yukni siljitish uchun.",
    ru: "Тележки (кошки) для ручных талей 0,5–5 т — для перемещения груза по двутавровой балке.",
  },
  stroplar: {
    name: "Stroplar", nameRu: "Стропы", nameEn: "Slings", icon: "🪢",
    uz: "Tekstil (STP, STK), zanjirli (1SC, 4SC) va arqon (2SK, 4SK) stroplar 1–10 tonna. Strop narxi QQS bilan, katta hajmda — alohida narx.",
    ru: "Текстильные (СТП, СТК), цепные (1СЦ, 4СЦ) и канатные (2СК, 4СК) стропы 1–10 т. Цена стропов с НДС, на крупные партии — отдельные цены.",
  },
  "kotarish-stollari": {
    name: "Ko'tarish stollari", nameRu: "Подъёмные столы", nameEn: "Lifting tables", icon: "⬆️",
    uz: "Gidravlik va elektr ko'tarish stollari 150–2000 kg — ishlab chiqarish liniyalari, omborlar va yuk ortish uchun.",
    ru: "Гидравлические и электрические подъёмные столы 150–2000 кг — для производственных линий, складов и погрузки.",
  },
  avtokotargichlar: {
    name: "Avtoko'targichlar", nameRu: "Автоподъёмники", nameEn: "Car lifts", icon: "🚗",
    uz: "Ikki ustunli (4,2–5,5 t), to'rt ustunli va qaychi avtoko'targichlar — avtoservis, shinomontaj va razval-sxojdenie uchun. Avtoko'targich narxi QQS bilan.",
    ru: "Двухстоечные (4,2–5,5 т), четырёхстоечные и ножничные автоподъёмники для автосервиса, шиномонтажа и развал-схождения. Цена подъёмника с НДС.",
  },
  "shinomontaj-stanoklari": {
    name: "Shinomontaj stanoklari", nameRu: "Шиномонтажные станки", nameEn: "Tyre changers", icon: "🛞",
    uz: "Yengil avtomobillar va yuk mashinalari uchun shinomontaj stanoklari — 10–21\" disklar uchun yarim avtomat modellar va 56\" gacha og'ir texnika stanoklari.",
    ru: "Шиномонтажные станки для легковых и грузовых авто — полуавтоматы для дисков 10–21\" и станки для спецтехники до 56\".",
  },
  "balansirovka-stanoklari": {
    name: "Balansirovka stanoklari", nameRu: "Балансировочные станки", nameEn: "Wheel balancers", icon: "⚖️",
    uz: "Yengil va yuk g'ildiraklari uchun balansirovka stanoklari, aniqlik ±1 g. Balansirovka stanogi narxi QQS bilan.",
    ru: "Балансировочные станки для легковых и грузовых колёс, точность ±1 г. Цена балансировочного станка с НДС.",
  },
  "razval-sxojdenie-stendlari": {
    name: "Razval-sxojdenie stendlari", nameRu: "Стенды развал-схождения", nameEn: "Wheel aligners", icon: "🎯",
    uz: "3D razval-sxojdenie stendlari — 30 000 dan ortiq avtomobil bazasi, bitta va ikki ekranli, avtomatik ko'tariladigan modellar.",
    ru: "3D-стенды развал-схождения: база более 30 000 автомобилей, модели с одним и двумя экранами, с автоподъёмом камер.",
  },
  "avtokonditsioner-uskunalari": {
    name: "Avtokonditsioner zapravka uskunalari", nameRu: "Заправка автокондиционеров", nameEn: "A/C service stations", icon: "❄️",
    uz: "Avtokonditsionerlarni zapravka qilish stansiyalari (R134a, R1234yf), qo'lda, yarim avtomat va to'liq avtomat, hamda tizimni yuvish uskunalari.",
    ru: "Станции заправки автокондиционеров (R134a, R1234yf) — ручные, полуавтоматы и автоматы, а также установки промывки системы.",
  },
  "moy-almashtirish-uskunalari": {
    name: "Moy va suyuqlik almashtirish uskunalari", nameRu: "Замена масла и техжидкостей", nameEn: "Fluid exchangers", icon: "🛢️",
    uz: "Avtomat uzatmalar qutisi (AKPP) moyini almashtirish, tormoz suyuqligi va antifrizni almashtirish, dvigatelni yuvish va quruq muz bilan tozalash uskunalari.",
    ru: "Установки для замены масла в АКПП, тормозной жидкости и антифриза, промывки двигателя и чистки сухим льдом.",
  },
  "kuzov-tamirlash-uskunalari": {
    name: "Kuzov ta'mirlash uskunalari", nameRu: "Кузовной ремонт: стапели и споттеры", nameEn: "Body repair equipment", icon: "🔨",
    uz: "Kuzov stapellari (statsionar va ko'chma), spotterlar, alyuminiy kuzov uchun uskunalar va payvandlash apparatlari.",
    ru: "Стапели (стационарные и передвижные), споттеры, оборудование для алюминиевого кузова и сварочные аппараты.",
  },
  "boyash-kameralari": {
    name: "Bo'yash kameralari", nameRu: "Покрасочные камеры", nameEn: "Spray booths", icon: "🎨",
    uz: "Avtomobil bo'yash kameralari, ichki o'lcham 6900 × 3900 mm — platformali va platformasiz.",
    ru: "Покрасочные камеры для автомобилей, внутренние размеры 6900 × 3900 мм — с платформой и без.",
  },
  "motoblok-va-kultivatorlar": {
    name: "Motobloklar va kultivatorlar", nameRu: "Мотоблоки и культиваторы", nameEn: "Tillers & cultivators", icon: "🚜",
    uz: "Benzinli va dizel kultivatorlar 7–15 ot kuchi, ishlov berish kengligi 950–1350 mm, hamda o'tirib boshqariladigan motobloklar. Kultivator narxi QQS bilan.",
    ru: "Бензиновые и дизельные культиваторы 7–15 л.с. с шириной обработки 950–1350 мм и мотоблоки с сиденьем. Цена культиватора с НДС.",
  },
  trimmerlar: {
    name: "Trimmerlar (benzokosalar)", nameRu: "Триммеры (бензокосы)", nameEn: "Trimmers", icon: "🌿",
    uz: "Benzinli trimmerlar (benzokosa) — maysa, o't va buta o'rish uchun.",
    ru: "Бензиновые триммеры (бензокосы) для покоса газона, травы и кустарника.",
  },
  "yuqori-bosimli-yuvish-apparatlari": {
    name: "Yuqori bosimli yuvish apparatlari", nameRu: "Мойки высокого давления", nameEn: "Pressure washers", icon: "💦",
    uz: "Elektr va benzinli yuqori bosimli yuvish apparatlari 120–350 bar — avtomoyka, texnika va sanoat tozalash uchun.",
    ru: "Электрические и бензиновые мойки высокого давления 120–350 бар — для автомоек, техники и промышленной очистки.",
  },
};

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  console.log(APPLY ? "APPLY — writing changes" : "DRY RUN — nothing is written (add --apply to write)");

  // 1. Categories: create missing focus categories, fill empty fields.
  let created = 0;
  let filled = 0;
  for (const [slug, c] of Object.entries(FOCUS_CATEGORIES)) {
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) {
      created++;
      console.log(`  + category ${slug}`);
      if (APPLY) await prisma.category.create({ data: { slug, name: c.name, nameRu: c.nameRu, nameEn: c.nameEn, icon: c.icon, description: c.uz, descriptionRu: c.ru } });
      continue;
    }
    const data = {
      ...(!cat.nameRu && { nameRu: c.nameRu }),
      ...(!cat.nameEn && { nameEn: c.nameEn }),
      ...(!cat.icon && { icon: c.icon }),
      ...(!cat.description && { description: c.uz }),
      ...(!cat.descriptionRu && { descriptionRu: c.ru }),
    };
    if (Object.keys(data).length) {
      filled++;
      console.log(`  ~ category ${slug}: ${Object.keys(data).join(", ")}`);
      if (APPLY) await prisma.category.update({ where: { slug }, data });
    }
  }

  // 2. Order: focus categories first in direction order, others after (keeping their relative order).
  const all = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, slug: true, sortOrder: true } });
  let reordered = 0;
  let next = 1000;
  for (const cat of all) {
    const i = FOCUS_CATEGORY_ORDER.indexOf(cat.slug);
    const order = i >= 0 ? (i + 1) * 10 : (next += 10);
    if (order !== cat.sortOrder) {
      reordered++;
      if (APPLY) await prisma.category.update({ where: { id: cat.id }, data: { sortOrder: order } });
    }
  }

  // 3. Filter fields from product names (only empty ones, focus categories only).
  const products = await prisma.product.findMany({
    where: { category: { slug: { in: FOCUS_CATEGORY_ORDER } } },
    select: { id: true, name: true, sku: true, capacityKg: true, liftHeightMm: true, workingWidthMm: true, powerKw: true, category: { select: { slug: true } } },
  });
  let specUpdates = 0;
  for (const p of products) {
    const guess = specsFromName(p.name, p.category.slug);
    const data: Partial<Record<SpecField, number>> = {};
    for (const [k, v] of Object.entries(guess) as [SpecField, number][]) {
      if (p[k] === null && Number.isFinite(v) && v > 0) data[k] = k === "liftHeightMm" || k === "workingWidthMm" ? Math.round(v) : v;
    }
    if (Object.keys(data).length) {
      specUpdates++;
      if (!APPLY && specUpdates <= 15) console.log(`  specs ${p.sku ?? p.id}: ${JSON.stringify(data)}  ← ${p.name}`);
      if (APPLY) await prisma.product.update({ where: { id: p.id }, data });
    }
  }

  console.log(`Categories created: ${created}, filled: ${filled}, re-ordered: ${reordered}. Products with spec fields filled: ${specUpdates} of ${products.length}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
