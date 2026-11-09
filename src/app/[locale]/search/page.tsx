import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { SearchView } from "./search-view";

// The plain catalogue URL is cached; a search or filter goes to ./filtered (see src/lib/catalog-route.ts).
export async function generateMetadata(props: PageProps<"/[locale]/search">): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/search", title: t.meta.searchTitle, description: t.meta.searchDescription });
}

export default async function SearchPage(props: PageProps<"/[locale]/search">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  return <SearchView locale={locale} sp={{}} />;
}
