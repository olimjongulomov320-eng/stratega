import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { cache, Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getHeaderCategories, getSparePartCategories } from "@/lib/categories";
import { ProductCard } from "@/components/product-card";
import { CategorySidebar } from "@/components/category-sidebar";
import { PriceFilter } from "@/components/price-filter";
import { CatalogToolbar } from "@/components/catalog-toolbar";
import { CatalogFilters } from "@/components/catalog-filters";
import { CatalogPagination } from "@/components/catalog-pagination";
import { parseSort, sortToOrderBy, toCard } from "@/lib/products";
import { getDictionary, fmt } from "@/i18n";
import { isLocale, localePath } from "@/i18n/config";
import { localName, localDescription, excerpt } from "@/lib/localize";
import { formatNumber } from "@/lib/format";
import { pageMetadata, absoluteUrl, jsonLd } from "@/lib/seo";
import type { Prisma } from "@/generated/prisma/client";
import { SPEC_FILTERS } from "@/lib/product-specs";
import { directionOfCategory } from "@/lib/focus";
import { getBuyerPrices } from "@/lib/customer-price";

const getCategory = cache(async (slug: string) => {
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category || !category.isActive) return null;
  const stats = await prisma.product.aggregate({
    where: { categoryId: category.id, isActive: true },
    _count: true,
    _min: { price: true },
  });
  return { category, count: stats._count, minPrice: stats._min.price ?? 0 };
});

export async function generateMetadata(props: PageProps<"/[locale]/category/[slug]">): Promise<Metadata> {
  const { locale, slug } = await props.params;
  if (!isLocale(locale)) return {};
  const data = await getCategory(slug);
  if (!data) return {};
  const t = getDictionary(locale);
  const name = localName(data.category, locale);
  const own = localDescription(data.category, locale);
  return pageMetadata({
    locale,
    path: `/category/${slug}`,
    title: fmt(t.meta.categoryTitle, { name }),
    description: own
      ? excerpt(own)
      : fmt(t.meta.categoryDescription, { name, count: data.count, from: formatNumber(data.minPrice) }),
    image: data.category.imageUrl,
    // An empty category should not be indexed until it has products on sale.
    ...(data.count === 0 && { noindex: true }),
  });
}

function num(value: string | string[] | undefined): number | undefined {
  if (typeof value !== "string") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export default async function CategoryPage(props: PageProps<"/[locale]/category/[slug]">) {
  const { locale, slug } = await props.params;
  if (!isLocale(locale)) notFound();
  const sp = await props.searchParams;
  const t = getDictionary(locale);
  const lp = (p: string) => localePath(locale, p);

  const data = await getCategory(slug);
  if (!data) notFound();
  const { category } = data;

  const sort = parseSort(sp.sort);
  const minPrice = num(sp.minPrice);
  const maxPrice = num(sp.maxPrice);
  const brand = typeof sp.brand === "string" ? sp.brand.trim().slice(0, 80) : "";
  const inStock = sp.inStock === "1";
  const page = Math.max(1, Math.floor(num(sp.page) ?? 1));
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
    const lo = num(sp[sf.min]);
    const hi = num(sp[sf.max]);
    if (lo === undefined && hi === undefined) return [];
    return [{ [sf.field]: { ...(lo !== undefined ? { gte: lo } : {}), ...(hi !== undefined ? { lte: hi } : {}) } }];
  });
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    categoryId: category.id,
    ...(minPrice !== undefined || maxPrice !== undefined
      ? { price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } }
      : {}),
    ...(brand ? { brand } : {}),
    ...(inStock ? { stock: { gt: 0 } } : {}),
    ...(specWhere.length ? { AND: specWhere } : {}),
  };
  const [categories, products, total, brands] = await Promise.all([
    category.isSparePart ? getSparePartCategories(locale) : getHeaderCategories(locale),
    prisma.product.findMany({ where, orderBy: sortToOrderBy(sort), take: pageSize, skip: (page - 1) * pageSize }),
    prisma.product.count({ where }),
    prisma.product.findMany({ where: { isActive: true, categoryId: category.id, brand: { not: null } }, distinct: ["brand"], select: { brand: true }, orderBy: { brand: "asc" } }),
  ]);
  const brandOptions = brands.map((item) => item.brand).filter((value): value is string => !!value?.trim());
  const buyer = await getBuyerPrices(products.map((p) => p.id));
  const direction = directionOfCategory(category.slug);

  const name = localName(category, locale);
  const intro = localDescription(category, locale);
  const pageUrl = absoluteUrl(lp(`/category/${slug}`));
  const structuredData = [
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

      <h1 className="text-2xl font-bold text-slate-800">
        <span aria-hidden="true">{category.icon}</span> {name}
      </h1>
      {intro && <p className="mt-2 max-w-3xl whitespace-pre-line text-slate-600">{intro}</p>}

      <div className="mt-6 grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="flex flex-col gap-6">
          <CategorySidebar categories={categories} activeSlug={slug} locale={locale} />
          <div className="border-t border-slate-200 pt-5">
            <Suspense fallback={null}>
              <PriceFilter />
            </Suspense>
            <CatalogFilters brands={brandOptions} />
          </div>
          {specFilters.map((sf) => (
            <div key={sf.field} className="border-t border-slate-200 pt-5">
              <Suspense fallback={null}>
                <PriceFilter
                  minParam={sf.min}
                  maxParam={sf.max}
                  label={`${sf.label[locale]}, ${sf.unit[locale]}`}
                  placeholderMin={String(specRange._min[sf.field] ?? "")}
                  placeholderMax={String(specRange._max[sf.field] ?? "")}
                />
              </Suspense>
            </div>
          ))}
        </aside>

        <div>
          <Suspense fallback={null}>
            <CatalogToolbar totalCount={total} currentSort={sort} />
          </Suspense>
          {products.length === 0 ? (
            <p className="mt-8 text-slate-500">{t.catalog.noResults}</p>
          ) : (
            <div className="product-grid mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={toCard(p, locale, buyer.get(p.id))} priority={i < 4} />
              ))}
            </div>
          )}
          <CatalogPagination pathname={localePath(locale, `/category/${slug}`)} page={page} pageSize={pageSize} total={total} params={sp} labels={{ previous: t.catalog.previous, next: t.catalog.next, page: t.catalog.page }} />
        </div>
      </div>
    </div>
  );
}
