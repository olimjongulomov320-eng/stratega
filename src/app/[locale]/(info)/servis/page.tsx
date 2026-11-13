import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { SERVICE_PAGE } from "@/config/service-pages";
import { RequestPage } from "@/components/request-page";

export async function generateMetadata(props: PageProps<"/[locale]/servis">): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const p = SERVICE_PAGE[locale];
  return pageMetadata({ locale, path: "/servis", title: p.seoTitle, description: p.description });
}

export default async function ServicePage(props: PageProps<"/[locale]/servis">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  return <RequestPage text={SERVICE_PAGE[locale]} locale={locale} links={[{ href: "/ehtiyot-qismlar", label: SERVICE_PAGE[locale].sections[1].h2 }]} />;
}
