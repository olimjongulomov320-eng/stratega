import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";

/** Utility pages (cart, account, compare…) must not be indexed. */
export const NOINDEX: Metadata = { robots: { index: false, follow: false } };

type PrivatePage = "cart" | "sent" | "wishlist" | "compare" | "login" | "cabinet";

const TITLES: Record<PrivatePage, Record<Locale, string>> = {
  cart: { uz: "Korzina", ru: "Корзина", en: "Cart" },
  sent: { uz: "Ariza yuborildi", ru: "Заявка отправлена", en: "Request sent" },
  wishlist: { uz: "Sevimlilar", ru: "Избранное", en: "Wishlist" },
  compare: { uz: "Solishtirish", ru: "Сравнение", en: "Compare" },
  login: { uz: "Kirish", ru: "Вход", en: "Sign in" },
  cabinet: { uz: "Shaxsiy kabinet", ru: "Личный кабинет", en: "My account" },
};

const PATHS: Record<PrivatePage, string> = {
  cart: "/korzina",
  sent: "/korzina-yuborildi",
  wishlist: "/wishlist",
  compare: "/compare",
  login: "/kirish",
  cabinet: "/kabinet",
};

/** generateMetadata for a utility page: its own title in the page language, never indexed. */
export function privatePageMetadata(page: PrivatePage) {
  return async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
    if (!isLocale(locale)) return NOINDEX;
    const title = `${TITLES[page][locale]} | Stratega`;
    const meta = pageMetadata({ locale, path: PATHS[page], title, description: title });
    return { ...meta, description: undefined, robots: NOINDEX.robots };
  };
}
