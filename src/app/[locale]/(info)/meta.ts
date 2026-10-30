import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";

type Key = "about" | "delivery" | "payment" | "returns" | "faq" | "contacts";

export async function infoMetadata(params: Promise<{ locale: string }>, key: Key): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  const page = t.info[key];
  const description = "lead" in page && page.lead ? page.lead : t.meta.homeDescription;
  return pageMetadata({ locale, path: `/${key}`, title: `${page.title} | Stratega`, description });
}
