import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale } from "@/i18n/config";
import { SparePartsView, sparePartsMetadata } from "./spare-parts-view";

// The plain page is cached; a search goes to ./filtered (see src/lib/catalog-route.ts).
export async function generateMetadata(props: PageProps<"/[locale]/ehtiyot-qismlar">): Promise<Metadata> {
  const { locale } = await props.params;
  return isLocale(locale) ? sparePartsMetadata(locale, false) : {};
}

export default async function SparePartsPage(props: PageProps<"/[locale]/ehtiyot-qismlar">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  return <SparePartsView locale={locale} q="" />;
}
