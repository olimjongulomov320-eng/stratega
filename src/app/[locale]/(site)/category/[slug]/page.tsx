import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getCategories } from "@/lib/categories";
import { ProductCard } from "@/components/product-card";
import { CategorySidebar } from "@/components/category-sidebar";
import { PriceFilter } from "@/components/price-filter";
import { CatalogToolbar } from "@/components/catalog-toolbar";
import { parseSortOption, sortToOrderBy } from "@/lib/product-query";
import { localizeProduct, localizeCategory } from "@/lib/localize";
import type { AppLocale } from "@/i18n/routing";
import type { Prisma } from "@/generated/prisma/client";

export default async function CategoryPage(
  props: PageProps<"/[locale]/category/[slug]">
) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const t = await getTranslations("category");
  const tCommon = await getTranslations("common");
  const locale = (await getLocale()) as AppLocale;

  const categoryRaw = await prisma.category.findUnique({ where: { slug } });
  if (!categoryRaw) notFound();
  const category = localizeCategory(categoryRaw, locale);

  const sort = parseSortOption(
    typeof searchParams.sort === "string" ? searchParams.sort : undefined
  );
  const minPrice = toNumber(searchParams.minPrice);
  const maxPrice = toNumber(searchParams.maxPrice);

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    categoryId: categoryRaw.id,
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          price: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  };

  const [categories, productsRaw] = await Promise.all([
    getCategories(locale),
    prisma.product.findMany({ where, orderBy: sortToOrderBy(sort) }),
  ]);
  const products = productsRaw.map((p) => localizeProduct(p, locale));

  const headerCategories = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    productCount: c._count.products,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/" className="hover:text-indigo-600">
          {tCommon("homePage")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{category.name}</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold text-slate-800">
        {category.icon} {category.name}
      </h1>

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="flex flex-col gap-6">
          <CategorySidebar categories={headerCategories} activeSlug={slug} />
          <div className="border-t border-slate-200 pt-5">
            <PriceFilter />
          </div>
        </aside>

        <div>
          <CatalogToolbar totalCount={products.length} currentSort={sort} />
          {products.length === 0 ? (
            <p className="mt-8 text-slate-500">{t("empty")}</p>
          ) : (
            <div className="product-grid mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    slug: product.slug,
                    name: product.name,
                    price: product.price,
                    oldPrice: product.oldPrice,
                    imageUrl: product.imageUrl,
                    stock: product.stock,
                    rating: product.rating,
                    reviewCount: product.reviewCount,
                    soldCount: product.soldCount,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function toNumber(value: string | string[] | undefined): number | undefined {
  if (typeof value !== "string") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}
