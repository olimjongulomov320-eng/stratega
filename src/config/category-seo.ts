// Search titles and descriptions for the main categories, keyed by category slug.
// A category that is not listed here uses the generic template from the dictionaries
// (meta.categoryTitle / meta.categoryDescription) or its own SEO text from the admin panel.

import type { Locale } from "@/i18n/config";

type CategorySeo = Record<Locale, { title: string; description: string }>;

export const CATEGORY_SEO: Record<string, CategorySeo> = {
  "elektr-shtabelerlar": {
    uz: {
      title: "Elektr shtabelerlar narxi Toshkentda, 1.6–4.5 m | Stratega",
      description:
        "Elektr shtabelerlar (yarim avtomat va avtomat), 2 tonna, ko'tarish balandligi 1.6–4.5 m. Narxlar QQS bilan. Toshkentda mavjud.",
    },
    ru: {
      title: "Электрические штабелеры в Ташкенте — цены, 1,6–4,5 м | Stratega",
      description:
        "Электрические штабелеры (полуавтомат и самоходные) 2 т, высота подъёма 1,6–4,5 м. Цены с НДС. В наличии в Ташкенте.",
    },
    en: {
      title: "Electric stackers in Tashkent — prices, 1.6–4.5 m | Stratega",
      description:
        "Electric stackers (semi-electric and self-propelled), 2 t, lift height 1.6–4.5 m. Prices incl. VAT. In stock in Tashkent.",
    },
  },
  "gidravlik-telejkalar": {
    uz: {
      title: "Gidravlik telejka (rohlya) narxi Toshkentda | Stratega",
      description:
        "Gidravlik telejkalar (rohlya) 3 tonna: oddiy, tarozili va rulon uchun. Narxlar QQS bilan. Toshkentda mavjud, yetkazib berish.",
    },
    ru: {
      title: "Гидравлические тележки (рохли) в Ташкенте — цены | Stratega",
      description:
        "Гидравлические тележки (рохли, транспалеты) 3 т: стандартные, с весами, для рулонов. Цены с НДС. В наличии в Ташкенте.",
    },
    en: {
      title: "Hydraulic pallet trucks in Tashkent — prices | Stratega",
      description:
        "Hydraulic hand pallet trucks, 3 t: standard, with scales and for rolls. Prices incl. VAT. In stock in Tashkent, with delivery.",
    },
  },
  "payvandlash-apparatlari": {
    uz: {
      title: "PE (PND) quvur payvandlash apparatlari narxi | Stratega",
      description:
        "PE, PND va HDPE quvurlarni uchma-uch payvandlash (stykovka) apparatlari 63–630 mm va PPR payka. Narxlar QQS bilan. Toshkentda mavjud.",
    },
    ru: {
      title: "Аппараты для стыковой сварки ПНД труб в Ташкенте | Stratega",
      description:
        "Аппараты стыковой сварки ПНД (PE, HDPE) труб 63–630 мм и паяльники для PPR. Цены с НДС. В наличии в Ташкенте, доставка по Узбекистану.",
    },
    en: {
      title: "PE (HDPE) pipe butt-fusion welders in Tashkent | Stratega",
      description:
        "Butt-fusion welding machines for PE (HDPE) pipes, 63–630 mm, and PPR socket welders. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
  },
  "avtokotargichlar": {
    uz: {
      title: "Avtoko'targich narxi Toshkentda — ikki va to'rt ustunli | Stratega",
      description:
        "Ikki ustunli, to'rt ustunli va qaychi avtoko'targichlar 3,5–5,5 t, Karjoys. Avtoservis va shinomontaj uchun. Narxlar QQS bilan, O'zbekiston bo'ylab yetkazib berish.",
    },
    ru: {
      title: "Автоподъёмники в Ташкенте — цены, двухстоечные и ножничные | Stratega",
      description:
        "Двухстоечные, четырёхстоечные и ножничные автоподъёмники 3,5–5,5 т Karjoys для СТО и шиномонтажа. Цены с НДС, доставка по Узбекистану.",
    },
    en: {
      title: "Car lifts in Tashkent — two-post, four-post, scissor | Stratega",
      description:
        "Two-post, four-post and scissor car lifts, 3.5–5.5 t, Karjoys. Prices incl. VAT, delivery across Uzbekistan.",
    },
  },
  "shinomontaj-stanoklari": {
    uz: {
      title: "Shinomontaj stanogi narxi Toshkentda | Stratega",
      description:
        "Yengil va yuk avtomobillari uchun shinomontaj stanoklari Karjoys: 10–21\" disklar, yuk va og'ir texnika uchun 56\" gacha. Narxlar QQS bilan.",
    },
    ru: {
      title: "Шиномонтажные станки в Ташкенте — цены, купить | Stratega",
      description:
        "Шиномонтажные станки Karjoys для легковых и грузовых авто: диски 10–21\", для грузовиков и спецтехники до 56\". Цены с НДС, доставка по Узбекистану.",
    },
    en: {
      title: "Tyre changers in Tashkent — prices | Stratega",
      description:
        "Karjoys tyre changers for cars (10–21\" rims) and trucks up to 56\". Prices incl. VAT, delivery across Uzbekistan.",
    },
  },
  "balansirovka-stanoklari": {
    uz: {
      title: "Balansirovka stanogi narxi Toshkentda | Stratega",
      description:
        "Yengil va yuk g'ildiraklari uchun balansirovka stanoklari Karjoys, aniqlik ±1 g. Narxlar QQS bilan, O'zbekiston bo'ylab yetkazib berish.",
    },
    ru: {
      title: "Балансировочные станки в Ташкенте — цены | Stratega",
      description:
        "Балансировочные станки Karjoys для легковых и грузовых колёс, точность ±1 г. Цены с НДС, доставка по Узбекистану.",
    },
    en: {
      title: "Wheel balancers in Tashkent — prices | Stratega",
      description:
        "Karjoys wheel balancers for car and truck wheels, ±1 g accuracy. Prices incl. VAT.",
    },
  },
  "razval-sxojdenie-stendlari": {
    uz: {
      title: "3D razval-sxojdenie stendi narxi Toshkentda | Stratega",
      description:
        "3D razval-sxojdenie stendlari Karjoys: 30 000 dan ortiq avtomobil bazasi, bitta va ikki ekranli modellar. Narxlar QQS bilan.",
    },
    ru: {
      title: "Стенды развал-схождения 3D в Ташкенте — цены | Stratega",
      description:
        "3D-стенды развал-схождения Karjoys: база более 30 000 автомобилей, модели с одним и двумя экранами. Цены с НДС, доставка по Узбекистану.",
    },
    en: {
      title: "3D wheel aligners in Tashkent — prices | Stratega",
      description:
        "Karjoys 3D wheel aligners with a 30,000+ vehicle database. Prices incl. VAT.",
    },
  },
  "avtokonditsioner-uskunalari": {
    uz: {
      title: "Avtokonditsioner zapravka stansiyasi narxi | Stratega",
      description:
        "Avtokonditsionerlarni zapravka qilish stansiyalari R134a va R1234yf: qo'lda, yarim avtomat va to'liq avtomat. Narxlar QQS bilan.",
    },
    ru: {
      title: "Установки для заправки автокондиционеров — цены | Stratega",
      description:
        "Станции заправки автокондиционеров R134a и R1234yf: ручные, полуавтоматические и автоматические Karjoys. Цены с НДС, доставка по Узбекистану.",
    },
    en: {
      title: "A/C service stations — prices | Stratega",
      description:
        "Karjoys A/C recovery and recharge stations for R134a and R1234yf. Prices incl. VAT.",
    },
  },
  "kuzov-tamirlash-uskunalari": {
    uz: {
      title: "Kuzov stapeli va spotter narxi Toshkentda | Stratega",
      description:
        "Kuzov ta'mirlash uchun stapellar, spotterlar va payvandlash apparatlari Karjoys. Narxlar QQS bilan, O'zbekiston bo'ylab yetkazib berish.",
    },
    ru: {
      title: "Стапели и споттеры для кузовного ремонта — цены | Stratega",
      description:
        "Стапели, споттеры и сварочные аппараты Karjoys для кузовного ремонта. Цены с НДС, доставка по Узбекистану.",
    },
    en: {
      title: "Frame machines and spotters — prices | Stratega",
      description:
        "Karjoys frame machines, spotters and welders for body repair. Prices incl. VAT.",
    },
  },
  "stroplar": {
    uz: {
      title: "Strop narxi Toshkentda — tekstil, zanjirli, arqon | Stratega",
      description:
        "Tekstil (STP, STK), zanjirli va arqon stroplar TOR 1–10 t. Strop narxi QQS bilan, katta hajmga alohida narx.",
    },
    ru: {
      title: "Стропы в Ташкенте — цены: текстильные, цепные, канатные | Stratega",
      description:
        "Текстильные (СТП, СТК), цепные и канатные стропы TOR 1–10 т. Цены с НДС, для крупных партий — отдельные цены.",
    },
    en: {
      title: "Lifting slings in Tashkent — prices | Stratega",
      description:
        "TOR textile, chain and wire-rope slings, 1–10 t. Prices incl. VAT.",
    },
  },
  "elektr-tallar": {
    uz: {
      title: "Elektr tal narxi Toshkentda | Stratega",
      description:
        "Elektr arqonli va zanjirli tallar TOR 200 kg – 5 t, 220/380 V. Narxlar QQS bilan, O'zbekiston bo'ylab yetkazib berish.",
    },
    ru: {
      title: "Тали электрические в Ташкенте — цены | Stratega",
      description:
        "Электрические канатные и цепные тали TOR от 200 кг до 5 т, 220/380 В. Цены с НДС, доставка по Узбекистану.",
    },
    en: {
      title: "Electric hoists in Tashkent — prices | Stratega",
      description:
        "TOR electric wire-rope and chain hoists, 200 kg – 5 t. Prices incl. VAT.",
    },
  },
  "qol-zanjirli-tallar": {
    uz: {
      title: "Qo'l zanjirli tal narxi Toshkentda | Stratega",
      description:
        "Qo'l zanjirli tallar TOR 0,5–10 t, ko'tarish balandligi 3–6 m. Tal narxi QQS bilan.",
    },
    ru: {
      title: "Тали ручные цепные в Ташкенте — цены | Stratega",
      description:
        "Ручные цепные тали TOR 0,5–10 т, высота подъёма 3–6 м. Цены с НДС, доставка по Узбекистану.",
    },
    en: {
      title: "Manual chain hoists in Tashkent — prices | Stratega",
      description:
        "TOR manual chain hoists, 0.5–10 t. Prices incl. VAT.",
    },
  },
  "generatorlar": {
    uz: {
      title: "Generator narxi Toshkentda — benzinli va dizel | Stratega",
      description:
        "Benzinli va dizel generatorlar 2,8–10 kVt, elektr starterli modellar. Narxlar QQS bilan, O'zbekiston bo'ylab yetkazib berish.",
    },
    ru: {
      title: "Генераторы в Ташкенте — цены, бензиновые и дизельные | Stratega",
      description:
        "Бензиновые и дизельные генераторы 2,8–10 кВт, модели с электростартером. Цены с НДС, доставка по Узбекистану.",
    },
    en: {
      title: "Generators in Tashkent — prices | Stratega",
      description:
        "Petrol and diesel generators, 2.8–10 kW. Prices incl. VAT.",
    },
  },
  "pol-yuvish-mashinalari": {
    uz: {
      title: "Pol yuvish mashinasi narxi Toshkentda | Stratega",
      description:
        "Akkumulyatorli va kabelli pol yuvish mashinalari, o'tirib boshqariladigan modellar 330–860 mm. Narxlar QQS bilan.",
    },
    ru: {
      title: "Поломоечные машины в Ташкенте — цены | Stratega",
      description:
        "Аккумуляторные и сетевые поломоечные машины, модели с сиденьем, ширина 330–860 мм. Цены с НДС, доставка по Узбекистану.",
    },
    en: {
      title: "Floor scrubbers in Tashkent — prices | Stratega",
      description:
        "Battery and corded floor scrubbers, walk-behind and ride-on, 330–860 mm. Prices incl. VAT.",
    },
  },
};
