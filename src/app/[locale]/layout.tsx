import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@fontsource-variable/inter";
import "../globals.css";
import { LOCALES, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { I18nProvider } from "@/i18n/client";
import { Providers } from "@/lib/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ChatWidget } from "@/components/chat-widget";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { getHeaderCategories, getSparePartCategories, directionsFrom } from "@/lib/categories";
import { getCurrentUser } from "@/lib/auth";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(props: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.meta.homeTitle, template: `%s | Stratega` },
    description: t.meta.homeDescription,
    icons: { icon: "/favicon.ico" },
  };
}

export default async function LocaleLayout(props: LayoutProps<"/[locale]">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const [categories, partCategories, user] = await Promise.all([getHeaderCategories(locale), getSparePartCategories(locale), getCurrentUser()]);
  const headerUser = user ? { phone: user.phone, companyName: user.companyName } : null;

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white text-slate-800">
        <I18nProvider locale={locale} dict={dict}>
          <div className="flex min-h-full flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">
            <Providers>
              <Header categories={categories} directions={directionsFrom(categories, locale)} user={headerUser} hasSpareParts={partCategories.length > 0} />
              <main className="flex-1">{props.children}</main>
              <Footer categories={categories} locale={locale} />
              <ChatWidget />
              <MobileTabBar user={headerUser} />
            </Providers>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
