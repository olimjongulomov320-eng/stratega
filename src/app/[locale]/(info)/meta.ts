import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";

type Key = "about" | "delivery" | "payment" | "returns" | "faq" | "contacts";

// Search titles for the info pages (the page heading stays the short name), and a description for pages without a lead.
const SEO: Record<Key, Record<"uz" | "ru" | "en", { title: string; description?: string }>> = {
  about: {
    uz: { title: "Stratega haqida — Toshkentdagi texnika yetkazib beruvchi" },
    ru: { title: "О компании Stratega — поставщик техники в Ташкенте" },
    en: { title: "About Stratega — equipment supplier in Tashkent" },
  },
  delivery: {
    uz: { title: "Toshkent va O'zbekiston bo'ylab yetkazib berish, kafolat | Stratega" },
    ru: { title: "Доставка по Ташкенту и Узбекистану, гарантия | Stratega" },
    en: { title: "Delivery in Tashkent and Uzbekistan, warranty | Stratega" },
  },
  payment: {
    uz: { title: "To'lov usullari: QQS bilan o'tkazma, naqd, karta | Stratega" },
    ru: { title: "Способы оплаты: перечисление с НДС, наличные, карта | Stratega" },
    en: { title: "Payment: bank transfer with VAT, cash, card | Stratega" },
  },
  returns: {
    uz: { title: "Mahsulotni qaytarish va almashtirish shartlari | Stratega" },
    ru: { title: "Возврат и обмен товара: условия | Stratega" },
    en: { title: "Returns and exchanges | Stratega" },
  },
  faq: {
    uz: { title: "Buyurtma, yetkazish va to'lov bo'yicha savollar | Stratega" },
    ru: { title: "Частые вопросы о заказе, доставке и оплате | Stratega" },
    en: { title: "FAQ: ordering, delivery and payment | Stratega" },
  },
  contacts: {
    uz: { title: "Stratega kontaktlari: telefon, INDEX bozoridagi do'kon", description: "Stratega telefoni, Telegram va Toshkentdagi INDEX bozoridagi do'kon manzili (G1 blok). Shartnoma va to'lov uchun MChJ «STRATEGA» rekvizitlari." },
    ru: { title: "Контакты Stratega: телефон, магазин на рынке INDEX", description: "Телефон, Telegram и адрес магазина Stratega на рынке INDEX в Ташкенте (блок G1). Реквизиты ООО «STRATEGA» для договора и оплаты." },
    en: { title: "Contact Stratega: phone, shop at INDEX market", description: "Stratega phone, Telegram and shop address at INDEX market in Tashkent (block G1). Company details of STRATEGA LLC for contracts and payment." },
  },
};

export async function infoMetadata(params: Promise<{ locale: string }>, key: Key): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  const page = t.info[key];
  const seo = SEO[key][locale];
  const description = seo.description ?? ("lead" in page && page.lead ? page.lead : t.meta.homeDescription);
  return pageMetadata({ locale, path: `/${key}`, title: seo.title, description });
}
