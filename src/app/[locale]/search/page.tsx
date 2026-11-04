import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getHeaderCategories } from "@/lib/categories";
import { ProductCard } from "@/components/product-card";
import { CategorySidebar } from "@/components/category-sidebar";
import { CatalogAside } from "@/components/catalog-aside";
import { PriceFilter } from "@/components/price-filter";
import { CatalogToolbar } from "@/components/catalog-toolbar";
import { CatalogFilters } from "@/components/catalog-filters";
import { CatalogPagination } from "@/components/catalog-pagination";
import { parseSort, sortToOrderBy, searchWhere, toCard } from "@/lib/products";
import { numParam, pageParam, rangeFilter } from "@/lib/query-params";
import { getDictionary, fmt } from "@/i18n";
import { isLocale, localePath } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import type { Prisma } from "@/generated/prisma/client";

export async function generateMetadata(props: PageProps<"/[locale]/search">): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const sp = await props.searchParams;
  const t = getDictionary(locale);
  const hasQuery = typeof sp.q === "string" && sp.q.trim().length > 0;
  // Search result pages are not indexed; the plain catalogue page is.
  return pageMetadata({ locale, path: "/search", title: t.meta.searchTitle, description: t.meta.searchDescription, noindex: hasQuery });
}

export default async function SearchPage(props: PageProps<"/[locale]/search">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  const sp = await props.searchParams;
  const t = getDictionary(locale);
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const sort = parseSort(sp.sort);
  const priceRange = rangeFilter(numParam(sp.minPrice), numParam(sp.maxPrice), true);
  const brand = typeof sp.brand === "string" ? sp.brand.trim().slice(0, 80) : "";
  const inStock = sp.inStock === "1";
  const page = pageParam(sp.page);
  const pageSize = 24;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(q ? searchWhere(q) : {}),
    ...(brand ? { brand } : {}),
    ...(inStock ? { stock: { gt: 0 } } : {}),
    // "Price on request" items have no public price, so a price filter skips them.
    ...(priceRange ? { price: priceRange, priceOnRequest: false } : {}),
  };
  const [categories, products, total, brands] = await Promise.all([
    getHeaderCategories(locale),
    prisma.product.findMany({ where, orderBy: sortToOrderBy(sort), take: pageSize, skip: (page - 1) * pageSize }),
    prisma.product.count({ where }),
    prisma.product.findMany({ where: { isActive: true, brand: { not: null } }, distinct: ["brand"], select: { brand: true }, orderBy: { brand: "asc" } }),
  ]);
  const brandOptions = brands.map((item) => item.brand).filter((value): value is string => !!value?.trim());

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">{q ? fmt(t.catalog.searchResults, { q }) : t.catalog.allProducts}</h1>
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <CatalogAside label={t.catalog.categoriesAndFilters}>
          <CategorySidebar categories={categories} locale={locale} />
          <div className="border-t border-slate-200 pt-5">
            <Suspense fallback={null}>
              <PriceFilter />
            </Suspense>
            <CatalogFilters brands={brandOptions} />
          </div>
        </CatalogAside>
        <div>
          <Suspense fallback={null}>
            <CatalogToolbar totalCount={total} currentSort={sort} />
          </Suspense>
          {products.length === 0 ? (
            <p className="mt-8 text-slate-500">{t.catalog.noResults}</p>
          ) : (
            <div className="product-grid mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={toCard(p, locale)} priority={i < 4} />
              ))}
            </div>
          )}
          <CatalogPagination pathname={localePath(locale, "/search")} page={page} pageSize={pageSize} total={total} params={sp} labels={{ previous: t.catalog.previous, next: t.catalog.next, page: t.catalog.page }} />
        </div>
      </div>
    </div>
  );
}
