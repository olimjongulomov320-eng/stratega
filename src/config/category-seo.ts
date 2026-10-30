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
};
