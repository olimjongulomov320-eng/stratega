// Marketing claims in ONE place. Every claim is shown on the site only when it is switched on.
// Switch a claim on only when it is true and you can prove it (documents, invoices, an address).

import type { Locale } from "@/i18n/config";

export const CLAIMS = {
  /** "Rasmiy yetkazib beruvchi / official supplier" — true: STRATEGA imports directly from factories. */
  officialSupplier: true,
  /** VAT invoices and full document package for legal entities. */
  vatDocuments: true,
  /** Delivery across Uzbekistan. */
  deliveryUzbekistan: true,
  /** Same-day delivery within Tashkent. */
  tashkentSameDay: true,
  /** Free delivery within Tashkent for orders from this amount, so'm. null = hidden. */
  freeTashkentFrom: 2_000_000 as number | null,
  /** Electronic documents and VAT invoices (ESF) through Didox. */
  didox: true,
  /** "2000+ units sold": set to a real, provable number (e.g. 2000) to show "2000+", or null to hide. */
  unitsSold: null as number | null,
  /** CE certificate — enable only if you hold the certificates for the products shown. */
  ceCertificate: false,
  /** "Service centre in Tashkent" — enable only if you have one at a real address. */
  serviceCenter: false,
  /** "Genuine spare parts always in stock" — enable only if that is true. */
  sparePartsInStock: false,
  /** Payment deferral for regular customers, in days. null = hidden. */
  paymentTermsDays: null as number | null,
  /** Default warranty in months shown when a product has no own value. null = hidden. */
  defaultWarrantyMonths: null as number | null,
  /** Instalment payments ("muddatli to'lov"). Switch on only if you really offer them. */
  installments: false,
};

/** Trust badges on the home page. Each one appears only when its claim above is switched on. */
export const TRUST_BADGES: { on: boolean; icon: string; text: Record<Locale, string> }[] = [
  {
    on: CLAIMS.ceCertificate,
    icon: "📜",
    text: { uz: "CE sertifikati", ru: "Сертификат CE", en: "CE certificate" },
  },
  {
    on: CLAIMS.serviceCenter,
    icon: "🛠️",
    text: { uz: "Toshkentda servis markazi", ru: "Сервисный центр в Ташкенте", en: "Service centre in Tashkent" },
  },
  {
    on: CLAIMS.sparePartsInStock,
    icon: "⚙️",
    text: { uz: "Original ehtiyot qismlar doim omborda", ru: "Оригинальные запчасти всегда в наличии", en: "Genuine spare parts always in stock" },
  },
];
