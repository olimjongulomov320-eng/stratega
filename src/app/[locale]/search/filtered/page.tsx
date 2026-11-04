import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { SearchView } from "../search-view";

// A search or filtered catalogue, rendered per request. Reached through a rewrite in src/proxy.ts; the browser keeps the plain URL.
export async function generateMetadata(props: PageProps<"/[locale]/search/filtered">): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const sp = await props.searchParams;
  const t = getDictionary(locale);
  const hasQuery = typeof sp.q === "string" && sp.q.trim().length > 0;
  // Search result pages are not indexed; the plain catalogue page is.
  return pageMetadata({ locale, path: "/search", title: t.meta.searchTitle, description: t.meta.searchDescription, noindex: hasQuery });
}

export default async function FilteredSearchPage(props: PageProps<"/[locale]/search/filtered">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  return <SearchView locale={locale} sp={await props.searchParams} />;
}
