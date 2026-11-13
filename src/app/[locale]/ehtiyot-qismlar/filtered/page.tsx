import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { isLocale } from "@/i18n/config";
import { SparePartsView, sparePartsMetadata } from "../spare-parts-view";
import { FILTERED_REWRITE_HEADER } from "@/lib/catalog-route";
import { pageParam } from "@/lib/query-params";

// A spare-parts search, rendered per request. Reached through a rewrite in src/proxy.ts; the browser keeps the plain URL. Opened directly it is a 404.
const query = (q: string | string[] | undefined) => (typeof q === "string" ? q.trim().slice(0, 80) : "");

export async function generateMetadata(props: PageProps<"/[locale]/ehtiyot-qismlar/filtered">): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  return sparePartsMetadata(locale, query((await props.searchParams).q).length > 0);
}

export default async function FilteredSparePartsPage(props: PageProps<"/[locale]/ehtiyot-qismlar/filtered">) {
  const { locale } = await props.params;
  if (!isLocale(locale) || !(await headers()).has(FILTERED_REWRITE_HEADER)) notFound();
  const sp = await props.searchParams;
  return <SparePartsView locale={locale} q={query(sp.q)} page={pageParam(sp.page)} />;
}
