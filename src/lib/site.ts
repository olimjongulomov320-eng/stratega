// Company facts and marketing claims in ONE place.
// Every claim below is shown on the site only when it is switched on (true).
// Switch a claim on only when it is true and you can prove it.

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
  city: "Tashkent",
  country: "UZ",
  bank: "AKB «Kapitalbank»",
  mfo: "01158",
  // Bank account number: fill in from the bank details. Left empty = not shown.
  bankAccount: "",
  hours: { uz: "Dushanba–Shanba, 09:00–21:00", ru: "Понедельник–Суббота, 09:00–21:00", en: "Monday–Saturday, 09:00–21:00" },
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

export const CLAIMS = {
  /** "Rasmiy yetkazib beruvchi / official supplier" — true: STRATEGA imports directly from factories. */
  officialSupplier: true,
  /** VAT invoices and full document package for legal entities. */
  vatDocuments: true,
  /** Delivery across Uzbekistan. */
  deliveryUzbekistan: true,
  /** Show the number of units sold. Set to a real number (e.g. 350) to enable, or null to hide. */
  unitsSold: null as number | null,
  /** CE certificate — enable only if you hold the certificates for the products shown. */
  ceCertificate: false,
  /** Own service centre in Tashkent. */
  serviceCenter: false,
  /** Spare parts kept in stock. */
  sparePartsInStock: false,
  /** Payment deferral for regular customers, in days. null = hidden. */
  paymentTermsDays: null as number | null,
  /** Default warranty in months shown when a product has no own value. null = hidden. */
  defaultWarrantyMonths: null as number | null,
  /** Instalment payments ("muddatli to'lov"). Switch on only if you really offer them. */
  installments: false,
};
