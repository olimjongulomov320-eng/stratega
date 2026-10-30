// STRATEGA's main product directions ("yo'nalishlar"). Each groups several catalogue categories
// and has its own landing page (/yonalish/<slug>) with search-friendly text in Uzbek and Russian.
// Order here = order on the home page and in the menu.
import type { Locale } from "@/i18n/config";

type L = Record<Locale, string>;

export type FocusDirection = {
  slug: string;
  icon: string;
  name: L;
  /** One line under the name on cards. */
  tagline: L;
  /** Landing-page intro (SEO text). Paragraphs separated by a blank line. */
  intro: L;
  /** Category slugs in this direction, in display order. Missing / empty categories are skipped. */
  categories: string[];
};

export const FOCUS: FocusDirection[] = [
  {
    slug: "ombor-texnikasi",
    icon: "🏗️",
    name: { uz: "Ombor texnikasi", ru: "Складская техника", en: "Warehouse equipment" },
    tagline: {
      uz: "Rohlyalar, shtabelerlar, elektr telejkalar",
      ru: "Рохли, штабелеры, электротележки",
      en: "Pallet trucks, stackers, electric trucks",
    },
    intro: {
      uz:
        "Gidravlik telejka (rohlya), qo'l va elektr shtabelerlar, elektr telejkalar — omborlar, savdo markazlari va ishlab chiqarish uchun. Uskunalarni to'g'ridan-to'g'ri zavoddan olib kelamiz, shuning uchun rohlya narxi va shtabeler narxi ochiq ko'rsatilgan.\n\n" +
        "Yuridik shaxslar uchun QQS bilan hisob-faktura va shartnoma. Toshkent va viloyatlarga yetkazib beramiz. Rohlya g'ildiraklari va gidravlika uchun ehtiyot qismlar ham bor.",
      ru:
        "Гидравлические тележки (рохли), ручные и электрические штабелеры, электротележки для складов, торговых центров и производства. Поставляем напрямую с заводов, поэтому цена рохли и цена штабелера указаны открыто.\n\n" +
        "Для юридических лиц — договор и счёт-фактура с НДС. Доставка по Ташкенту и регионам Узбекистана. Есть запчасти: колёса и гидравлика для рохлей.",
      en:
        "Hand pallet trucks, manual and electric stackers and electric pallet trucks for warehouses, retail and production. Imported directly from the factories, with prices shown openly.\n\nVAT invoices and contracts for companies; delivery across Uzbekistan; spare wheels and hydraulic parts.",
    },
    categories: ["gidravlik-telejkalar", "elektr-telejkalar", "qol-shtabelerlari", "elektr-shtabelerlar", "richtraklar", "elektr-yuk-ortgichlar", "platformali-telejkalar", "bochka-telejkalari"],
  },
  {
    slug: "pol-yuvish-texnikasi",
    icon: "🧽",
    name: { uz: "Pol yuvish texnikasi", ru: "Поломоечная техника", en: "Floor cleaning machines" },
    tagline: {
      uz: "Pol yuvish va supurish mashinalari, changyutgichlar",
      ru: "Поломоечные и подметальные машины, пылесосы",
      en: "Scrubbers, sweepers, industrial vacuums",
    },
    intro: {
      uz:
        "Akkumulyatorli va kabelli pol yuvish mashinalari, o'tirib boshqariladigan mashinalar, supurish mashinalari va sanoat changyutgichlari — savdo markazlari, omborlar, zavodlar va tozalash kompaniyalari uchun.\n\n" +
        "Pol yuvish mashinasi narxi ishchi kengligi va akkumulyatorga bog'liq — filtrlarda ishchi kenglik bo'yicha tanlang. Cho'tka, pad va skrebok kabi sarf materiallarini ham yetkazib beramiz.",
      ru:
        "Аккумуляторные и сетевые поломоечные машины, машины с сиденьем оператора, подметальные машины и промышленные пылесосы — для торговых центров, складов, заводов и клининговых компаний.\n\n" +
        "Цена поломоечной машины зависит от ширины уборки и аккумулятора — используйте фильтр по ширине. Поставляем также щётки, пады и сквиджи.",
      en:
        "Battery and corded scrubbers, ride-on scrubbers, sweepers and industrial vacuums for malls, warehouses, factories and cleaning companies. Filter by working width; brushes, pads and squeegees available.",
    },
    categories: ["pol-yuvish-mashinalari", "supurish-mashinalari", "sanoat-changyutgichlari"],
  },
  {
    slug: "pe-quvur-payvandlash",
    icon: "🔥",
    name: { uz: "PE quvur payvandlash", ru: "Сварка ПЭ труб", en: "PE pipe welding" },
    tagline: {
      uz: "TURAN apparatlari 63–630 mm, gidravlik modellar",
      ru: "Аппараты TURAN 63–630 мм, гидравлические модели",
      en: "TURAN butt fusion welders 63–630 mm",
    },
    intro: {
      uz:
        "Polietilen (PE) quvurlarni uchma-uch payvandlash apparatlari TURAN: qo'l modellari 63–250 mm va gidravlik modellar 90–630 mm. Suv ta'minoti, gaz va kanalizatsiya quvurlarini yotqizuvchi qurilish tashkilotlari uchun.\n\n" +
        "Quvur payvandlash apparati narxi diametr diapazoniga bog'liq. Isitish plitasi, frezer va vkladishlar kabi ehtiyot qismlarni ham taklif qilamiz. Tenderlar uchun hujjatlar tayyorlaymiz.",
      ru:
        "Аппараты стыковой сварки полиэтиленовых (ПЭ) труб TURAN: ручные модели 63–250 мм и гидравлические 90–630 мм. Для строительных организаций, прокладывающих водопровод, газопровод и канализацию.\n\n" +
        "Цена сварочного аппарата для ПЭ труб зависит от диапазона диаметров. Есть запчасти: нагревательные пластины, торцеватели, вкладыши. Готовим документы для тендеров.",
      en:
        "TURAN butt fusion welders for polyethylene pipe: manual 63–250 mm and hydraulic 90–630 mm models for water, gas and sewer contractors. Heater plates, facers and inserts available; tender documents on request.",
    },
    categories: ["payvandlash-apparatlari"],
  },
  {
    slug: "generatorlar",
    icon: "⚡",
    name: { uz: "Generatorlar", ru: "Генераторы", en: "Generators" },
    tagline: {
      uz: "Benzinli, dizel va invertorli generatorlar",
      ru: "Бензиновые, дизельные и инверторные генераторы",
      en: "Petrol, diesel and inverter generators",
    },
    intro: {
      uz:
        "2,8 kVt dan 10 kVt gacha benzinli, dizel va invertorli generatorlar — qurilish maydonchalari, do'konlar, uy va dala ishlari uchun. Elektr starterli modellar ham bor.\n\n" +
        "Generator narxi quvvatga va starter turiga bog'liq — filtrda quvvatni tanlang.",
      ru:
        "Бензиновые, дизельные и инверторные генераторы от 2,8 до 10 кВт — для стройплощадок, магазинов, дома и полевых работ. Есть модели с электростартером.\n\n" +
        "Цена генератора зависит от мощности и типа запуска — выберите мощность в фильтре.",
      en: "Petrol, diesel and inverter generators from 2.8 to 10 kW, including electric-start models. Filter by power.",
    },
    categories: ["generatorlar", "invertorli-generatorlar"],
  },
  {
    slug: "yuk-kotarish-va-takelaj",
    icon: "⛓️",
    name: { uz: "Yuk ko'tarish va takelaj", ru: "Грузоподъёмное оборудование и такелаж", en: "Lifting & rigging" },
    tagline: {
      uz: "Tallar, stroplar, ko'tarish stollari",
      ru: "Тали, стропы, подъёмные столы",
      en: "Hoists, chain blocks, slings, lifting tables",
    },
    intro: {
      uz:
        "Qo'l zanjirli va richagli tallar, elektr tallar, tal aravachalari, tekstil, zanjirli va arqon stroplar hamda gidravlik ko'tarish stollari — ustaxonalar, omborlar va qurilish uchun.\n\n" +
        "Har bir tal va strop yuk ko'tarish quvvati va uzunligi bilan ko'rsatilgan — filtrda kerakli quvvatni tanlang. Katta hajmdagi buyurtmalar uchun yuridik shaxslarga alohida narx.",
      ru:
        "Ручные цепные и рычажные тали, электрические тали, тележки для талей, текстильные, цепные и канатные стропы, гидравлические подъёмные столы — для мастерских, складов и строительства.\n\n" +
        "Для каждой тали и стропа указаны грузоподъёмность и длина — выберите нужную грузоподъёмность в фильтре. Для крупных заказов юрлицам — отдельные цены.",
      en: "Manual chain and lever hoists, electric hoists, trolleys, textile, chain and wire-rope slings and hydraulic lifting tables. Filter by capacity.",
    },
    categories: ["qol-zanjirli-tallar", "richagli-tallar", "elektr-tallar", "tal-aravachalari", "stroplar", "kotarish-stollari"],
  },
  {
    slug: "avtoservis-uskunalari",
    icon: "🔧",
    name: { uz: "Avtoservis uskunalari", ru: "Автосервисное оборудование", en: "Car service equipment" },
    tagline: {
      uz: "Avtoko'targichlar, shinomontaj, balansirovka, razval-sxojdenie",
      ru: "Автоподъёмники, шиномонтаж, балансировка, развал-схождение",
      en: "Car lifts, tyre changers, wheel balancers, wheel aligners",
    },
    intro: {
      uz:
        "Avtoservis va shinomontaj uchun uskunalar: ikki ustunli, to'rt ustunli va qaychi avtoko'targichlar, shinomontaj va balansirovka stanoklari, 3D razval-sxojdenie stendlari, avtokonditsioner zapravka stansiyalari, moy almashtirish uskunalari, kuzov stapellari, spotterlar va bo'yash kameralari.\n\n" +
        "Karjoys zavodidan to'g'ridan-to'g'ri import — narxlar ochiq, QQS bilan. Avtoservis ochish yoki kengaytirish uchun to'liq uskuna to'plamini menejer bilan birga tanlang.",
      ru:
        "Оборудование для автосервиса и шиномонтажа: двухстоечные, четырёхстоечные и ножничные автоподъёмники, шиномонтажные и балансировочные станки, 3D-стенды развал-схождения, установки для заправки автокондиционеров, оборудование для замены масла, стапели, споттеры и покрасочные камеры.\n\n" +
        "Прямой импорт с завода Karjoys — цены открыты, с НДС. Подберём с менеджером полный комплект оборудования для открытия или расширения СТО.",
      en:
        "Car-service and tyre-shop equipment: two-post, four-post and scissor lifts, tyre changers, wheel balancers, 3D wheel aligners, A/C service stations, fluid exchangers, frame machines, spotters and spray booths. Imported directly from Karjoys.",
    },
    categories: [
      "avtokotargichlar",
      "shinomontaj-stanoklari",
      "balansirovka-stanoklari",
      "razval-sxojdenie-stendlari",
      "avtokonditsioner-uskunalari",
      "moy-almashtirish-uskunalari",
      "kuzov-tamirlash-uskunalari",
      "boyash-kameralari",
    ],
  },
  {
    slug: "kultivator-va-trimmerlar",
    icon: "🌱",
    name: { uz: "Kultivator va trimmerlar", ru: "Культиваторы и триммеры", en: "Cultivators & trimmers" },
    tagline: {
      uz: "Benzinli va dizel kultivatorlar, motobloklar, trimmerlar",
      ru: "Бензиновые и дизельные культиваторы, мотоблоки, триммеры",
      en: "Petrol and diesel cultivators, tillers, trimmers",
    },
    intro: {
      uz:
        "Benzinli va dizel kultivatorlar (motobloklar) 7–15 ot kuchi, ishlov berish kengligi 950–1350 mm, hamda benzinli trimmerlar (benzokosa) — dehqon xo'jaliklari, bog' va tomorqa uchun.\n\n" +
        "Kultivator narxi dvigatel turi va quvvatiga bog'liq — filtrda quvvat va ishlov kengligini tanlang.",
      ru:
        "Бензиновые и дизельные культиваторы (мотоблоки) 7–15 л.с. с шириной обработки 950–1350 мм и бензиновые триммеры (бензокосы) — для фермерских хозяйств, садов и приусадебных участков.\n\n" +
        "Цена культиватора зависит от типа и мощности двигателя — выберите мощность и ширину обработки в фильтре.",
      en: "Petrol and diesel cultivators (7–15 hp, 950–1350 mm) and petrol trimmers for farms and gardens.",
    },
    categories: ["motoblok-va-kultivatorlar", "trimmerlar"],
  },
  {
    slug: "yuvish-apparatlari",
    icon: "💦",
    name: { uz: "Yuqori bosimli yuvish apparatlari", ru: "Мойки высокого давления", en: "Pressure washers" },
    tagline: {
      uz: "Elektr va benzinli, 120–350 bar",
      ru: "Электрические и бензиновые, 120–350 бар",
      en: "Electric and petrol, 120–350 bar",
    },
    intro: {
      uz:
        "Elektr va benzinli yuqori bosimli yuvish apparatlari 120 bardan 350 bargacha — avtomoyka, texnika, qurilish va sanoat tozalash uchun.",
      ru: "Электрические и бензиновые мойки высокого давления от 120 до 350 бар — для автомоек, техники, стройки и промышленной очистки.",
      en: "Electric and petrol pressure washers from 120 to 350 bar for car washes, machinery and industrial cleaning.",
    },
    categories: ["yuqori-bosimli-yuvish-apparatlari"],
  },
];

export function getFocus(slug: string): FocusDirection | undefined {
  return FOCUS.find((f) => f.slug === slug);
}

/** Focus category slugs in display order (used for menu ordering and the seed script). */
export const FOCUS_CATEGORY_ORDER: string[] = FOCUS.flatMap((f) => f.categories);

/** Category slug → its direction. */
export function directionOfCategory(slug: string): FocusDirection | undefined {
  return FOCUS.find((f) => f.categories.includes(slug));
}
