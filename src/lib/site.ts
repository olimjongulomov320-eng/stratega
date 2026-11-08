// Company facts in ONE place. Marketing claims are in src/config/site-claims.ts.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stratega.uz").replace(/\/$/, "");

export const COMPANY = {
  brand: "STRATEGA",
  legalName: "OOO «STRATEGA»",
  inn: "312506439",
  phone: "+998 99 301 11 70",
  phoneHref: "+998993011170",
  email: "info@stratega.uz",
  // Legal address (from company documents). Shown in contacts and in structured data.
  address: {
    uz: "Toshkent sh., Sergeli tumani, Nomdanak MFY, Nomdanak ko'chasi, 3-tor ko'chasi, 29-B uy",
    ru: "г. Ташкент, Сергелийский р-н, МФЙ Номданак, ул. Номданак, 3-тор кучаси, дом 29-Б",
    en: "29-B, 3-tor ko'chasi, Nomdanak St., Nomdanak MFY, Sergeli district, Tashkent",
  },
  // Shop where customers can see the equipment.
  shop: {
    uz: "Toshkent, INDEX bozori, G1 blok, G1-1-1022 do'kon",
    ru: "Ташкент, рынок INDEX, блок G1, магазин G1-1-1022",
    en: "Tashkent, INDEX market, block G1, shop G1-1-1022",
  },
  shopMapUrl: "https://yandex.uz/maps/?text=" + encodeURIComponent("Ташкент рынок INDEX"),
  // Seller shown on every product page. Put a person's name here to show it instead of the department.
  seller: {
    name: { uz: "Sotuv bo'limi", ru: "Отдел продаж", en: "Sales department" },
    phone: "+998 99 301 11 70",
    phoneHref: "+998993011170",
    telegram: "https://t.me/stratega_uz",
  },
  city: "Tashkent",
  country: "UZ",
  bank: "AKB «Kapitalbank»",
  mfo: "01158",
  // Bank account number: fill in from the bank details. Left empty = not shown.
  bankAccount: "",
  hours: { uz: "Dushanba–Shanba, 09:00–21:00", ru: "Понедельник–Суббота, 09:00–21:00", en: "Monday–Saturday, 09:00–21:00" },
  // The same hours for search engines (structured data). Keep both in step.
  openingHours: { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "09:00", closes: "21:00" },
  // Floating "write to us" buttons. Set a value to "" to hide that button.
  messengers: {
    telegram: "https://t.me/stratega_uz",
    // WhatsApp chat link for the company phone — check that this number is on WhatsApp.
    whatsapp: "https://wa.me/998993011170",
  },
  socials: {
    telegram: "https://t.me/stratega_uz",
    instagram: "https://instagram.com/stratega.uz",
    youtube: "https://youtube.com/@stratega_uz",
    facebook: "https://facebook.com/stratega.uz",
  },
};

// Marketing claims live in src/config/site-claims.ts (all off until proven).
export { CLAIMS, TRUST_BADGES } from "@/config/site-claims";
