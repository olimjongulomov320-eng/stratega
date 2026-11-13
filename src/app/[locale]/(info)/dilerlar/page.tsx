import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { DEALER_PAGE } from "@/config/service-pages";
import { RequestPage } from "@/components/request-page";

export async function generateMetadata(props: PageProps<"/[locale]/dilerlar">): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const p = DEALER_PAGE[locale];
  return pageMetadata({ locale, path: "/dilerlar", title: p.seoTitle, description: p.description });
}

export default async function DealerPage(props: PageProps<"/[locale]/dilerlar">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  return <RequestPage text={DEALER_PAGE[locale]} locale={locale} />;
}
