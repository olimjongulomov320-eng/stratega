import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { RfqForm } from "@/components/rfq-form";
import { StarRating } from "@/components/star-rating";
import { ProductCard } from "@/components/product-card";
import { getDemoReviews } from "@/lib/demo-reviews";
import { TrackView } from "@/components/track-view";
import { RecentlyViewedSection } from "@/components/recently-viewed-section";

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!product || !product.isActive) notFound();

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      isActive: true,
      id: { not: product.id },
    },
    take: 6,
    orderBy: { soldCount: "desc" },
  });

  const discountPercent = product.oldPrice
    ? Math.round(100 - (product.price / product.oldPrice) * 100)
    : null;

  const reviews = getDemoReviews(product.id, product.reviewCount);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <TrackView productId={product.id} />
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-slate-500">
        <Link href="/" className="hover:text-indigo-600">
          Bosh sahifa
        </Link>
        <span>/</span>
        <Link
          href={`/category/${product.category.slug}`}
          className="hover:text-indigo-600"
        >
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-slate-700">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative flex aspect-square items-center justify-center rounded-2xl bg-slate-50">
          {discountPercent !== null && (
            <span className="absolute left-4 top-4 rounded-md bg-rose-500 px-2.5 py-1 text-sm font-bold text-white">
              -{discountPercent}%
            </span>
          )}
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <span className="text-6xl">📦</span>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {product.name}
          </h1>

          <div className="flex items-center gap-3">
            <StarRating
              rating={product.rating}
              reviewCount={product.reviewCount}
              size="md"
            />
            {product.soldCount > 0 && (
              <span className="text-sm text-slate-400">
                · {product.soldCount}+ sotilgan
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold text-indigo-600">
              {formatSum(product.price)}
            </p>
            {product.oldPrice && (
              <p className="text-lg text-slate-400 line-through">
                {formatSum(product.oldPrice)}
              </p>
            )}
          </div>

          <p className="text-slate-600">{product.description}</p>

          <span className="w-fit text-sm text-slate-500">
            {product.stock > 0
              ? `Omborda: ${product.stock} dona`
              : "Hozircha mavjud emas"}
          </span>

          <RfqForm
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
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="mt-14 border-t border-slate-200 pt-8">
          <h2 className="mb-5 text-xl font-bold text-slate-800">
            Mijozlar sharhlari
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {reviews.map((review, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">
                    {review.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {review.daysAgo} kun oldin
                  </span>
                </div>
                <div className="mt-1">
                  <StarRating rating={review.rating} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mt-14 border-t border-slate-200 pt-8">
          <h2 className="mb-5 text-xl font-bold text-slate-800">
            O&apos;xshash mahsulotlar
          </h2>
          <div className="product-grid grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  slug: p.slug,
                  name: p.name,
                  price: p.price,
                  oldPrice: p.oldPrice,
                  imageUrl: p.imageUrl,
                  stock: p.stock,
                  rating: p.rating,
                  reviewCount: p.reviewCount,
                  soldCount: p.soldCount,
                }}
              />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewedSection excludeId={product.id} />
    </div>
  );
}
