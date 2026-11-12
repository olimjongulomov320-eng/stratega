import { notFound } from "next/navigation";
import { availableWhere } from "@/lib/sourcing";
import Link from "next/link";
import type { Metadata } from "next";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getHeaderCategories, getSparePartCategories } from "@/lib/categories";
import { ProductCard } from "@/components/product-card";
import { CategorySidebar } from "@/components/category-sidebar";
import { CatalogAside } from "@/components/catalog-aside";
import { PriceFilter } from "@/components/price-filter";
import { CatalogToolbar } from "@/components/catalog-toolbar";
import { CatalogFilters } from "@/components/catalog-filters";
import { CatalogPagination } from "@/components/catalog-pagination";
import { parseSort, sortToOrderBy, toCard } from "@/lib/products";
import { numParam, pageParam, rangeFilter, type CatalogParams } from "@/lib/query-params";
import { getDictionary, fmt } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { localName, localDescription, excerpt } from "@/lib/localize";
import { formatNumber } from "@/lib/format";
import { pageMetadata, absoluteUrl, jsonLd, fitTitle } from "@/lib/seo";
import type { Prisma } from "@/generated/prisma/client";
import { SPEC_FILTERS } from "@/lib/product-specs";
import { directionOfCategory } from "@/lib/focus";
import { CATEGORY_SEO } from "@/config/category-seo";
import { categoryFaq, faqJsonLd } from "@/lib/category-faq";

const getCategory = cache(async (slug: string) => {
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category || !category.isActive) return null;
  const [count, priced] = await Promise.all([
    prisma.product.count({ where: { categoryId: category.id, isActive: true } }),
    prisma.product.aggregate({ where: { categoryId: category.id, isActive: true, priceOnRequest: false }, _min: { price: true } }),
  ]);
  return { category, count, minPrice: priced._min.price };
});

export async function categoryMetadata(locale: string, slug: string): Promise<Metadata> {
  if (!isLocale(locale)) return {};
  const data = await getCategory(slug);
  if (!data) return { title: getDictionary(locale).notFound.title, robots: { index: false } };
  const t = getDictionary(locale);
  const name = localName(data.category, locale);
  const own = localDescription(data.category, locale);
  const seo = CATEGORY_SEO[slug]?.[locale];
  return pageMetadata({
    locale,
    path: `/category/${slug}`,
    title: seo?.title ?? fitTitle(fmt(t.meta.categoryTitle, { name }), `${name} | Stratega`),
    description:
      (seo?.description && excerpt(seo.description, 165)) ??
      (own
        ? excerpt(own)
        : data.minPrice !== null
          ? fmt(t.meta.categoryDescription, { name, count: data.count, from: formatNumber(data.minPrice) })
          : fmt(t.meta.categoryDescriptionNoPrice, { name, count: data.count })),
    image: data.category.imageUrl,
    // An empty category should not be indexed until it has products on sale.
    ...(data.count === 0 && { noindex: true }),
  });
}

/** A category page. `sp` is empty on the cached plain URL; the `filtered` route passes the URL's query. */
export async function CategoryView({ locale, slug, sp }: { locale: Locale; slug: string; sp: CatalogParams }) {
  const t = getDictionary(locale);
  const lp = (p: string) => localePath(locale, p);

  const data = await getCategory(slug);
  if (!data) notFound();
  const { category } = data;

  const sort = parseSort(sp.sort);
  const priceRange = rangeFilter(numParam(sp.minPrice), numParam(sp.maxPrice), true);
  const brand = typeof sp.brand === "string" ? sp.brand.trim().slice(0, 80) : "";
  const inStock = sp.inStock === "1";
  const page = pageParam(sp.page);
  const pageSize = 24;
  // Spec filters: shown only when products in this category have at least two different values.
  const specRange = await prisma.product.aggregate({
    where: { isActive: true, categoryId: category.id },
    _min: { capacityKg: true, liftHeightMm: true, workingWidthMm: true, powerKw: true },
    _max: { capacityKg: true, liftHeightMm: true, workingWidthMm: true, powerKw: true },
  });
  const specFilters = SPEC_FILTERS.filter((sf) => {
    const lo = specRange._min[sf.field];
    const hi = specRange._max[sf.field];
    return lo !== null && hi !== null && hi > lo;
  });
  const specWhere: Prisma.ProductWhereInput[] = specFilters.flatMap((sf) => {
    const range = rangeFilter(numParam(sp[sf.min]), numParam(sp[sf.max]), sf.int);
    return range ? [{ [sf.field]: range }] : [];
  });
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    categoryId: category.id,
    // "Price on request" items have no public price, so a price filter skips them.
    ...(priceRange ? { price: priceRange, priceOnRequest: false } : {}),
    ...(brand ? { brand } : {}),
    ...(inStock ? availableWhere : {}),
    ...(specWhere.length ? { AND: specWhere } : {}),
  };
  const [categories, products, total, brands] = await Promise.all([
    category.isSparePart ? getSparePartCategories(locale) : getHeaderCategories(locale),
    prisma.product.findMany({ where, orderBy: sortToOrderBy(sort), take: pageSize, skip: (page - 1) * pageSize }),
    prisma.product.count({ where }),
    prisma.product.findMany({ where: { isActive: true, categoryId: category.id, brand: { not: null } }, distinct: ["brand"], select: { brand: true }, orderBy: { brand: "asc" } }),
  ]);
  const brandOptions = brands.map((item) => item.brand).filter((value): value is string => !!value?.trim());
  const direction = directionOfCategory(category.slug);

  const name = localName(category, locale);
  // The admin intro wins; otherwise the search-phrase intro from config/category-seo.ts.
  const intro = localDescription(category, locale) || CATEGORY_SEO[slug]?.[locale]?.intro || null;
  const pageUrl = absoluteUrl(lp(`/category/${slug}`));
  const faq = categoryFaq(locale, name, data.count, data.minPrice);
  const structuredData = [
    faqJsonLd(faq),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t.common.home, item: absoluteUrl(lp("/")) },
        ...(direction ? [{ "@type": "ListItem", position: 2, name: direction.name[locale], item: absoluteUrl(lp(`/yonalish/${direction.slug}`)) }] : []),
        { "@type": "ListItem", position: direction ? 3 : 2, name, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name,
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: (page - 1) * pageSize + i + 1,
        url: absoluteUrl(lp(`/product/${p.slug}`)),
        name: localName(p, locale),
      })),
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
        {direction && (
          <>
            <Link href={lp(`/yonalish/${direction.slug}`)} className="hover:text-indigo-600">
              {direction.name[locale]}
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-slate-700" aria-current="page">
          {name}
        </span>
      </nav>

      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-2xl">{category.icon}</span>
        <h1 className="text-2xl font-bold text-slate-800">{name}</h1>
      </div>
      {intro && <p className="mt-2 max-w-3xl whitespace-pre-line text-slate-600">{intro}</p>}

      <div className="mt-6 grid gap-8 md:grid-cols-[220px_1fr]">
        <CatalogAside label={t.catalog.categoriesAndFilters}>
          <CategorySidebar categories={categories} activeSlug={slug} locale={locale} />
          <div className="border-t border-slate-200 pt-5">
            <PriceFilter params={sp} />
            <CatalogFilters brands={brandOptions} params={sp} />
          </div>
          {specFilters.map((sf) => (
            <div key={sf.field} className="border-t border-slate-200 pt-5">
              <PriceFilter
                params={sp}
                minParam={sf.min}
                maxParam={sf.max}
                label={`${sf.label[locale]}, ${sf.unit[locale]}`}
                placeholderMin={String(specRange._min[sf.field] ?? "")}
                placeholderMax={String(specRange._max[sf.field] ?? "")}
              />
            </div>
          ))}
        </CatalogAside>

        <div>
          <CatalogToolbar totalCount={total} currentSort={sort} />
          {products.length === 0 ? (
            <p className="mt-8 text-slate-500">{t.catalog.noResults}</p>
          ) : (
            <div className="product-grid mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={toCard(p, locale)} priority={i < 4} />
              ))}
            </div>
          )}
          <CatalogPagination pathname={localePath(locale, `/category/${slug}`)} page={page} pageSize={pageSize} total={total} params={sp} labels={{ previous: t.catalog.previous, next: t.catalog.next, page: t.catalog.page }} />
        </div>
      </div>

      <section className="mt-12 max-w-3xl border-t border-slate-200 pt-8">
        <h2 className="text-xl font-bold text-slate-800">{t.common.faqTitle}</h2>
        <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200">
          {faq.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="cursor-pointer list-none font-medium text-slate-800 marker:hidden">
                {f.q}
                <span className="float-right text-slate-400 group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-2 text-sm text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
