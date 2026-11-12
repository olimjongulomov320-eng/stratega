import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { getHeaderCategories } from "@/lib/categories";
import { getDictionary } from "@/i18n";
import { isLocale, localePath } from "@/i18n/config";
import { toCard } from "@/lib/products";
import { pageMetadata, absoluteUrl, jsonLd } from "@/lib/seo";
import { faqJsonLd } from "@/lib/category-faq";
import { COMPANY, SITE_URL } from "@/lib/site";
import { GUIDES, GUIDE_LOCALES, getGuide, isGuideLocale, type GuideBlock } from "@/config/guides";
import { GUIDE_UI } from "../ui";

export function generateStaticParams() {
  return GUIDE_LOCALES.flatMap((locale) => GUIDES.map((g) => ({ locale, slug: g.slug })));
}

export async function generateMetadata(props: PageProps<"/[locale]/qollanma/[slug]">): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const guide = getGuide(slug);
  if (!isLocale(locale) || !isGuideLocale(locale) || !guide) return { title: "Stratega", robots: { index: false } };
  const tx = guide.text[locale];
  return pageMetadata({ locale, path: `/qollanma/${slug}`, title: `${tx.seoTitle} | Stratega`, description: tx.description, type: "article", locales: GUIDE_LOCALES });
}

function Block({ b }: { b: GuideBlock }) {
  if ("h2" in b) return <h2 className="mt-8 text-xl font-bold text-slate-800">{b.h2}</h2>;
  if ("p" in b) return <p className="mt-3 leading-relaxed text-slate-700">{b.p}</p>;
  if ("ul" in b)
    return (
      <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-slate-700">
        {b.ul.map((li) => (
          <li key={li.slice(0, 40)}>{li}</li>
        ))}
      </ul>
    );
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {b.table.head.map((h) => (
              <th key={h} className="px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {b.table.rows.map((row) => (
            <tr key={row.join("|")} className="border-t border-slate-100">
              {row.map((cell, i) => (
                <td key={i} className="px-3 py-2 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function GuidePage(props: PageProps<"/[locale]/qollanma/[slug]">) {
  const { locale, slug } = await props.params;
  if (!isLocale(locale) || !isGuideLocale(locale)) notFound();
  const guide = getGuide(slug);
  if (!guide) notFound();
  const tx = guide.text[locale];
  const ui = GUIDE_UI[locale];
  const t = getDictionary(locale);
  const lp = (p: string) => localePath(locale, p);
  const url = absoluteUrl(lp(`/qollanma/${slug}`));

  const [rows, allCats] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true, slug: { in: guide.products } } }),
    getHeaderCategories(locale),
  ]);
  // Keep the order written in the guide.
  const products = guide.products.map((s) => rows.find((r) => r.slug === s)).filter((p) => p !== undefined);
  const cats = guide.categories.map((s) => allCats.find((c) => c.slug === s)).filter((c) => c !== undefined);
  const others = GUIDES.filter((g) => g.slug !== slug);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: tx.title,
      description: tx.description,
      inLanguage: locale,
      datePublished: guide.published,
      dateModified: guide.updated,
      mainEntityOfPage: url,
      author: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: COMPANY.brand, url: SITE_URL },
      publisher: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: COMPANY.brand, logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png") } },
      ...(products.length > 0 && {
        mentions: products.map((p) => ({ "@type": "Product", name: locale === "ru" ? p.nameRu || p.name : p.name, url: absoluteUrl(lp(`/product/${p.slug}`)) })),
      }),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t.common.home, item: absoluteUrl(lp("/")) },
        { "@type": "ListItem", position: 2, name: ui.title, item: absoluteUrl(lp("/qollanma")) },
        { "@type": "ListItem", position: 3, name: tx.title, item: url },
      ],
    },
    faqJsonLd(tx.faq),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structuredData)} />
      <nav aria-label="breadcrumb" className="mb-4 text-sm text-slate-500">
        <Link href={lp("/")} className="hover:text-indigo-600">
          {t.common.home}
        </Link>
        <span className="mx-2">/</span>
        <Link href={lp("/qollanma")} className="hover:text-indigo-600">
          {ui.title}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700" aria-current="page">
          {tx.title}
        </span>
      </nav>

      <article className="max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">{tx.title}</h1>
        <p className="mt-3 text-lg text-slate-600">{tx.lead}</p>
        <p className="mt-2 text-xs text-slate-400">
          {ui.updated}: <time dateTime={guide.updated}>{guide.updated.split("-").reverse().join(".")}</time>
        </p>
        {tx.body.map((b, i) => (
          <Block key={i} b={b} />
        ))}

        <aside className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
          <p className="font-semibold text-slate-800">{ui.ctaTitle}</p>
          <p className="mt-1 text-sm text-slate-600">{ui.ctaText}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={`tel:${COMPANY.phoneHref}`} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              📞 {COMPANY.phone}
            </a>
            {COMPANY.messengers.telegram && (
              <a href={COMPANY.messengers.telegram} target="_blank" rel="noopener noreferrer" className="rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:border-indigo-400">
                Telegram
              </a>
            )}
            {COMPANY.messengers.whatsapp && (
              <a href={COMPANY.messengers.whatsapp} target="_blank" rel="noopener noreferrer" className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:border-emerald-400">
                WhatsApp
              </a>
            )}
          </div>
        </aside>
      </article>

      {products.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-slate-800">{ui.products}</h2>
          <div className="product-grid grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={toCard(p, locale)} />
            ))}
          </div>
        </section>
      )}

      {cats.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {cats.map((c) => (
            <Link
              key={c.id}
              href={lp(`/category/${c.slug}`)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600"
            >
              {ui.allIn} {c.name} <span className="text-slate-400">· {c.productCount}</span>
            </Link>
          ))}
        </div>
      )}

      <section className="mt-10 max-w-3xl">
        <h2 className="text-lg font-bold text-slate-800">{ui.faq}</h2>
        <div className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {tx.faq.map((f) => (
            <details key={f.q} className="group px-4 py-3">
              <summary className="cursor-pointer font-medium text-slate-800">{f.q}</summary>
              <p className="mt-2 text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {others.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-slate-800">{ui.more}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((g) => (
              <li key={g.slug}>
                <Link href={lp(`/qollanma/${g.slug}`)} className="block h-full rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300">
                  <span aria-hidden="true">{g.icon} </span>
                  <span className="font-semibold text-slate-800">{g.text[locale].title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
