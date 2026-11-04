import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale } from "@/i18n/config";
import { CategoryView, categoryMetadata } from "../category-view";

// A category URL with filters, sorting or a page number, rendered per request. Reached through a rewrite in src/proxy.ts;
// the browser keeps the plain URL, and the canonical link points to it too.
export async function generateMetadata(props: PageProps<"/[locale]/category/[slug]/filtered">): Promise<Metadata> {
  const { locale, slug } = await props.params;
  return categoryMetadata(locale, slug);
}

export default async function FilteredCategoryPage(props: PageProps<"/[locale]/category/[slug]/filtered">) {
  const { locale, slug } = await props.params;
  if (!isLocale(locale)) notFound();
  return <CategoryView locale={locale} slug={slug} sp={await props.searchParams} />;
}
