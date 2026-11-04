import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSparePartCategories } from "@/lib/categories";
import { ProductCard } from "@/components/product-card";
import { searchWhere, toCard } from "@/lib/products";
import { getDictionary, fmt } from "@/i18n";
import { isLocale, localePath } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { COMPANY } from "@/lib/site";

export async function generateMetadata(props: PageProps<"/[locale]/ehtiyot-qismlar">): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const sp = await props.searchParams;
  const t = getDictionary(locale);
  const hasQuery = typeof sp.q === "string" && sp.q.trim().length > 0;
  // Until spare parts are on sale the page is empty, so it stays out of search results.
  const empty = (await getSparePartCategories(locale)).length === 0;
  return pageMetadata({ locale, path: "/ehtiyot-qismlar", title: t.parts.metaTitle, description: t.parts.metaDescription, noindex: hasQuery || empty });
}

/** Spare parts: part types + search by machine model / part code. */
export default async function SparePartsPage(props: PageProps<"/[locale]/ehtiyot-qismlar">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  const sp = await props.searchParams;
  const t = getDictionary(locale);
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const lp = (p: string) => localePath(locale, p);

  const [categories, products] = await Promise.all([
    getSparePartCategories(locale),
    q
      ? prisma.product.findMany({ where: { isActive: true, category: { isSparePart: true }, ...searchWhere(q) }, orderBy: [{ stock: "desc" }, { price: "asc" }], take: 120 })
      : prisma.product.findMany({ where: { isActive: true, category: { isSparePart: true } }, orderBy: [{ isFeatured: "desc" }, { stock: "desc" }], take: 24 }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-4 text-sm text-slate-500">
        <Link href={lp("/")} className="hover:text-indigo-600">{t.common.home}</Link> / <span className="text-slate-700">{t.parts.title}</span>
      </nav>
      <h1 className="text-3xl font-bold text-slate-900">{t.parts.title}</h1>
      <p className="mt-2 max-w-3xl text-slate-600">{t.parts.intro}</p>

      <form action={lp("/ehtiyot-qismlar")} className="mt-6 flex max-w-2xl gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder={t.parts.searchPlaceholder}
          aria-label={t.parts.searchPlaceholder}
          className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm outline-none focus:border-indigo-400"
        />
        <button className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">{t.parts.searchButton}</button>
      </form>

      {categories.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">{t.parts.categories}</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link key={c.id} href={lp(`/category/${c.slug}`)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:border-indigo-300 hover:text-indigo-600">
                {c.icon ? `${c.icon} ` : ""}{c.name} <span className="text-slate-400">· {c.productCount}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        {q && <h2 className="mb-4 text-xl font-bold text-slate-800">{fmt(t.parts.results, { q })}</h2>}
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-slate-600">
            <p>{t.parts.noResults}</p>
            <a href={`tel:${COMPANY.phoneHref}`} className="mt-3 inline-block font-semibold text-indigo-600">{COMPANY.phone}</a>
          </div>
        ) : (
          <div className="product-grid grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={toCard(p, locale)} priority={i < 4} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
