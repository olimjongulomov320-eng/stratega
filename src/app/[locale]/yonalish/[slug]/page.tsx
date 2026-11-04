import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { getHeaderCategories } from "@/lib/categories";
import { getFocus } from "@/lib/focus";
import { getBuyerPrices } from "@/lib/customer-price";
import { getDictionary, fmt } from "@/i18n";
import { isLocale, localePath } from "@/i18n/config";
import { sortToOrderBy, toCard } from "@/lib/products";
import { excerpt } from "@/lib/localize";
import { pageMetadata, absoluteUrl, jsonLd, fitTitle } from "@/lib/seo";

export async function generateMetadata(props: PageProps<"/[locale]/yonalish/[slug]">): Promise<Metadata> {
  const { locale, slug } = await props.params;
  if (!isLocale(locale)) return {};
  const dir = getFocus(slug);
  if (!dir) return { title: getDictionary(locale).notFound.title, robots: { index: false } };
  return pageMetadata({ locale, path: `/yonalish/${slug}`, title: fitTitle(`${dir.name[locale]} — ${dir.tagline[locale]} | Stratega`, `${dir.name[locale]} — ${dir.tagline[locale]}`), description: excerpt(dir.intro[locale]) });
}

export default async function DirectionPage(props: PageProps<"/[locale]/yonalish/[slug]">) {
  const { locale, slug } = await props.params;
  if (!isLocale(locale)) notFound();
  const dir = getFocus(slug);
  if (!dir) notFound();
  const t = getDictionary(locale);
  const lp = (p: string) => localePath(locale, p);

  const all = await getHeaderCategories(locale);
  const cats = dir.categories.map((s) => all.find((c) => c.slug === s)).filter((c) => c !== undefined);
  const products = cats.length
    ? await prisma.product.findMany({ where: { isActive: true, categoryId: { in: cats.map((c) => c.id) } }, orderBy: sortToOrderBy("popular"), take: 24 })
    : [];
  const buyer = await getBuyerPrices(products.map((p) => p.id));
  const name = dir.name[locale];
  const url = absoluteUrl(lp(`/yonalish/${slug}`));

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t.common.home, item: absoluteUrl(lp("/")) },
        { "@type": "ListItem", position: 2, name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name,
      itemListElement: cats.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, url: absoluteUrl(lp(`/category/${c.slug}`)) })),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structuredData)} />
      <nav aria-label="breadcrumb" className="mb-4 text-sm text-slate-500">
        <Link href={lp("/")} className="hover:text-indigo-600">
          {t.common.home}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700" aria-current="page">
          {name}
        </span>
      </nav>

      {/* The icon sits next to the H1, not inside it, so search engines read a clean heading. */}
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-2xl sm:text-3xl">{dir.icon}</span>
        <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">{name}</h1>
      </div>
      <div className="mt-3 max-w-3xl space-y-3 text-slate-600">
        {dir.intro[locale].split(/\n\n+/).map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>

      {cats.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-slate-800">{t.focus.categories}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {cats.map((c) => (
              <Link
                key={c.id}
                href={lp(`/category/${c.slug}`)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600"
              >
                {c.icon ? `${c.icon} ` : ""}
                {c.name} <span className="text-slate-400">· {c.productCount}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-slate-800">{t.focus.popular}</h2>
        {products.length === 0 ? (
          <p className="text-slate-500">{t.catalog.noResults}</p>
        ) : (
          <div className="product-grid grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={toCard(p, locale, buyer.get(p.id))} priority={i < 4} />
            ))}
          </div>
        )}
        {cats.length === 1 && products.length >= 24 && (
          <Link href={lp(`/category/${cats[0].slug}`)} className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:underline">
            {t.focus.allInDirection} →
          </Link>
        )}
      </section>
      <p className="sr-only">{fmt(t.focus.models, { n: cats.reduce((n, c) => n + c.productCount, 0) })}</p>
    </div>
  );
}
