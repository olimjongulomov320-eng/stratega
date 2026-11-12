import { prisma } from "@/lib/prisma";
import { availableWhere } from "@/lib/sourcing";
import { getHeaderCategories } from "@/lib/categories";
import { ProductCard } from "@/components/product-card";
import { CategorySidebar } from "@/components/category-sidebar";
import { CatalogAside } from "@/components/catalog-aside";
import { PriceFilter } from "@/components/price-filter";
import { CatalogToolbar } from "@/components/catalog-toolbar";
import { CatalogFilters } from "@/components/catalog-filters";
import { CatalogPagination } from "@/components/catalog-pagination";
import { parseSort, sortToOrderBy, searchWhere, toCard } from "@/lib/products";
import { matchCategories } from "@/lib/category-match";
import Link from "next/link";
import { numParam, pageParam, rangeFilter, type CatalogParams } from "@/lib/query-params";
import { getDictionary, fmt } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import type { Prisma } from "@/generated/prisma/client";

/** The catalogue and search results. `sp` is empty on the cached plain URL; the `filtered` route passes the URL's query. */
export async function SearchView({ locale, sp }: { locale: Locale; sp: CatalogParams }) {
  const t = getDictionary(locale);
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const sort = parseSort(sp.sort);
  const priceRange = rangeFilter(numParam(sp.minPrice), numParam(sp.maxPrice), true);
  const brand = typeof sp.brand === "string" ? sp.brand.trim().slice(0, 80) : "";
  const inStock = sp.inStock === "1";
  const page = pageParam(sp.page);
  const pageSize = 24;

  const filters: Prisma.ProductWhereInput = {
    isActive: true,
    ...(brand ? { brand } : {}),
    ...(inStock ? availableWhere : {}),
    // "Price on request" items have no public price, so a price filter skips them.
    ...(priceRange ? { price: priceRange, priceOnRequest: false } : {}),
  };
  const where: Prisma.ProductWhereInput = { ...filters, ...(q ? searchWhere(q) : {}) };
  const [categories, found, foundTotal, brands] = await Promise.all([
    getHeaderCategories(locale),
    prisma.product.findMany({ where, orderBy: sortToOrderBy(sort), take: pageSize, skip: (page - 1) * pageSize }),
    prisma.product.count({ where }),
    prisma.product.findMany({ where: { isActive: true, brand: { not: null } }, distinct: ["brand"], select: { brand: true }, orderBy: { brand: "asc" } }),
  ]);
  // Categories the query names ("пайка 110", "керхер karcher") are linked above the results. When the words
  // match no product text, the products of those categories are shown instead of an empty page.
  const matched = q ? matchCategories(q).map((s) => categories.find((c) => c.slug === s)).filter((c) => c !== undefined) : [];
  let products = found;
  let total = foundTotal;
  if (total === 0 && matched.length > 0) {
    const fallback: Prisma.ProductWhereInput = { ...filters, category: { slug: { in: matched.map((c) => c.slug) } } };
    [products, total] = await Promise.all([
      prisma.product.findMany({ where: fallback, orderBy: sortToOrderBy(sort), take: pageSize, skip: (page - 1) * pageSize }),
      prisma.product.count({ where: fallback }),
    ]);
  }
  const brandOptions = brands.map((item) => item.brand).filter((value): value is string => !!value?.trim());

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">{q ? fmt(t.catalog.searchResults, { q }) : t.catalog.allProducts}</h1>
      {matched.length > 0 && (
        <div className="-mt-3 mb-6 flex flex-wrap gap-2">
          {matched.map((c) => (
            <Link
              key={c.slug}
              href={localePath(locale, `/category/${c.slug}`)}
              className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:border-indigo-400"
            >
              {c.icon} {c.name} <span className="font-normal text-indigo-400">· {c.productCount}</span> →
            </Link>
          ))}
        </div>
      )}
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <CatalogAside label={t.catalog.categoriesAndFilters}>
          <CategorySidebar categories={categories} locale={locale} />
          <div className="border-t border-slate-200 pt-5">
            <PriceFilter params={sp} />
            <CatalogFilters brands={brandOptions} params={sp} />
          </div>
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
          <CatalogPagination pathname={localePath(locale, "/search")} page={page} pageSize={pageSize} total={total} params={sp} labels={{ previous: t.catalog.previous, next: t.catalog.next, page: t.catalog.page }} />
        </div>
      </div>
    </div>
  );
}
