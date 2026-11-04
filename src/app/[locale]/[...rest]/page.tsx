import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";

export async function generateMetadata(props: PageProps<"/[locale]/[...rest]">): Promise<Metadata> {
  const { locale } = await props.params;
  return isLocale(locale) ? { title: getDictionary(locale).notFound.title } : {};
}

// Any URL no other route matches: show the site's own 404 (with header and footer) instead of Next's bare default.
export default function UnknownPage() {
  notFound();
}
