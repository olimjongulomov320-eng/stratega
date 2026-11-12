import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale, localePath } from "@/i18n/config";
import { pageMetadata, absoluteUrl, jsonLd } from "@/lib/seo";
import { GUIDES, GUIDE_LOCALES, isGuideLocale } from "@/config/guides";
import { GUIDE_UI } from "./ui";

export function generateStaticParams() {
  return GUIDE_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(props: PageProps<"/[locale]/qollanma">): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale) || !isGuideLocale(locale)) return { title: "Stratega", robots: { index: false } };
  const ui = GUIDE_UI[locale];
  return pageMetadata({ locale, path: "/qollanma", title: ui.seoTitle, description: ui.description, locales: GUIDE_LOCALES });
}

export default async function GuidesPage(props: PageProps<"/[locale]/qollanma">) {
  const { locale } = await props.params;
  if (!isLocale(locale) || !isGuideLocale(locale)) notFound();
  const ui = GUIDE_UI[locale];
  const t = getDictionary(locale);
  const lp = (p: string) => localePath(locale, p);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: ui.title,
    itemListElement: GUIDES.map((g, i) => ({ "@type": "ListItem", position: i + 1, name: g.text[locale].title, url: absoluteUrl(lp(`/qollanma/${g.slug}`)) })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structuredData)} />
      <nav aria-label="breadcrumb" className="mb-4 text-sm text-slate-500">
        <Link href={lp("/")} className="hover:text-indigo-600">
          {t.common.home}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700" aria-current="page">
          {ui.title}
        </span>
      </nav>
      <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">{ui.title}</h1>
      <p className="mt-3 max-w-3xl text-slate-600">{ui.intro}</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link href={lp(`/qollanma/${g.slug}`)} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm">
              <span aria-hidden="true" className="text-2xl">
                {g.icon}
              </span>
              <span className="mt-2 text-lg font-semibold text-slate-800">{g.text[locale].title}</span>
              <span className="mt-2 flex-1 text-sm text-slate-600">{g.text[locale].lead}</span>
              <span className="mt-3 text-sm font-medium text-indigo-600">{ui.read} →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
