import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale } from "@/i18n/config";
import { CategoryView, categoryMetadata } from "./category-view";

// The plain category URL is cached: no page is built ahead, each is rendered on its first visit (time limit: [locale]/layout.tsx).
// URLs with filters, sorting or a page number go to ./filtered (see src/lib/catalog-route.ts).
export function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: PageProps<"/[locale]/category/[slug]">): Promise<Metadata> {
  const { locale, slug } = await props.params;
  return categoryMetadata(locale, slug);
}

export default async function CategoryPage(props: PageProps<"/[locale]/category/[slug]">) {
  const { locale, slug } = await props.params;
  if (!isLocale(locale)) notFound();
  return <CategoryView locale={locale} slug={slug} sp={{}} />;
}
