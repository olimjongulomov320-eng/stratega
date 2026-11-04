import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale } from "@/i18n/config";
import { SparePartsView, sparePartsMetadata } from "../spare-parts-view";

// A spare-parts search, rendered per request. Reached through a rewrite in src/proxy.ts; the browser keeps the plain URL.
const query = (q: string | string[] | undefined) => (typeof q === "string" ? q.trim().slice(0, 80) : "");

export async function generateMetadata(props: PageProps<"/[locale]/ehtiyot-qismlar/filtered">): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  return sparePartsMetadata(locale, query((await props.searchParams).q).length > 0);
}

export default async function FilteredSparePartsPage(props: PageProps<"/[locale]/ehtiyot-qismlar/filtered">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  return <SparePartsView locale={locale} q={query((await props.searchParams).q)} />;
}
