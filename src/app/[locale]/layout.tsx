import type { Metadata } from "next";
import { notFound, unstable_rethrow } from "next/navigation";
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
import { getHeaderCategories, getSparePartCategories, directionsFrom, type HeaderCategory } from "@/lib/categories";
import { shortenPageCache } from "@/lib/storefront-cache";
import { SITE_URL } from "@/lib/site";
import { Analytics } from "@/components/web-analytics";
import { Suspense } from "react";

// How long a public page stays cached. Saves in the admin panel and Telegram clear it at once (revalidateStorefront);
// this limit is for changes made outside the app, such as scripts run against the database.
export const revalidate = 3600;

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
  // A database failure must not take the layout down with it: the page's error.tsx then still shows contacts and navigation.
  // A page rendered without menus is cached only briefly, so it doesn't outlive the outage by an hour.
  const onFail = <T,>(fallback: T) => async (error: unknown) => {
    unstable_rethrow(error); // Next's own signals (e.g. "this page reads cookies") must pass through.
    console.error("Layout query failed", error instanceof Error ? error.message : error);
    await shortenPageCache();
    return fallback;
  };
  const [categories, partCategories] = await Promise.all([
    getHeaderCategories(locale).catch(onFail<HeaderCategory[]>([])),
    getSparePartCategories(locale).catch(onFail<HeaderCategory[]>([])),
  ]);

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white text-slate-800">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-slate-900 focus:shadow-lg">
          {dict.common.skipToContent}
        </a>
        <I18nProvider locale={locale} dict={dict}>
          <div className="flex min-h-full flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">
            <Providers>
              <Header categories={categories} directions={directionsFrom(categories, locale)} hasSpareParts={partCategories.length > 0} />
              <main id="main" className="flex-1">{props.children}</main>
              <Footer categories={categories} locale={locale} />
              <ChatWidget />
              <MobileTabBar />
            </Providers>
            <Suspense fallback={null}>
              <Analytics />
            </Suspense>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
