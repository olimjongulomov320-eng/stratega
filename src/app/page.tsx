import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { getCategories } from "@/lib/categories";
import { RecentlyViewedSection } from "@/components/recently-viewed-section";

export default async function Home() {
  const [categories, featuredProducts, popularProducts] = await Promise.all([
    getCategories(),
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 4,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { soldCount: "desc" },
      take: 12,
    }),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-16 text-center sm:px-6">
          <span className="rounded-full bg-white/15 px-4 py-1 text-sm font-medium text-white">
            Professional uskunalar, ishonchli yetkazib berish
          </span>
          <h1 className="max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl">
            Qurilish va sanoat texnikasi Stratega&apos;da
          </h1>
          <p className="max-w-xl text-lg text-indigo-100">
            Qurilish texnikasi, gidravlik uskunalar, klining va bog&apos;
            texnikasi — kafolat bilan, qulay narxlarda va tez yetkazib
            berish bilan.
          </p>
          <Link
            href="/search"
            className="rounded-full bg-white px-6 py-3 font-semibold text-indigo-600 transition hover:bg-indigo-50"
          >
            Xarid qilishni boshlash
          </Link>
        </div>
      </section>

      {/* Category tiles */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="mb-5 text-xl font-bold text-slate-800">Kategoriyalar</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition hover:border-indigo-300 hover:shadow-md"
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="text-xs font-medium text-slate-700">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <h2 className="text-xl font-bold text-slate-800">
                Tanlangan takliflar
              </h2>
            </div>
            <div className="product-grid grid grid-cols-2 gap-4 sm:grid-cols-4">
              {featuredProducts.map((product) => (
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
          </div>
        </section>
      )}

      {/* Popular products */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Ommabop mahsulotlar</h2>
          <Link
            href="/search"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Barchasini ko&apos;rish →
          </Link>
        </div>
        {popularProducts.length === 0 ? (
          <p className="text-slate-500">Hozircha mahsulotlar mavjud emas.</p>
        ) : (
          <div className="product-grid grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {popularProducts.map((product) => (
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
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <RecentlyViewedSection />
      </div>
    </div>
  );
}
