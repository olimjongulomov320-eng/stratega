import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { formatSum, formatNumber } from "@/lib/format";
import { ProductCard } from "@/components/product-card";
import { AddToCart } from "@/components/add-to-cart";
import { TrackView } from "@/components/track-view";
import { RecentlyViewedSection } from "@/components/recently-viewed-section";
import { getDictionary, fmt } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { localName, localDescription, excerpt } from "@/lib/localize";
import { toCard, modelTokens, sparePartsWhere } from "@/lib/products";
import { pageMetadata, absoluteUrl, jsonLd, fitTitle } from "@/lib/seo";
import { CLAIMS, COMPANY } from "@/lib/site";
import { SPEC_FILTERS, parseSpecRows, specLabel, youTubeId } from "@/lib/product-specs";
import { productLocales, productFacts, productMetaDescription } from "@/lib/product-seo";
import { isAvailable } from "@/lib/sourcing";
import { BuyerPriceBox } from "@/components/buyer-price-box";
import { ProductGallery } from "@/components/product-gallery";
import { QuickOrder } from "@/components/quick-order";

// No page is built ahead: each one is rendered on its first visit, then cached (time limit: [locale]/layout.tsx).
export function generateStaticParams() {
  return [];
}

const getProduct = cache(async (slug: string) =>
  prisma.product.findUnique({
    where: { slug },
    include: { category: true, reviews: { where: { isApproved: true }, orderBy: { createdAt: "desc" }, take: 20 } },
  })
);

export async function generateMetadata(props: PageProps<"/[locale]/product/[slug]">): Promise<Metadata> {
  const { locale, slug } = await props.params;
  if (!isLocale(locale)) return {};
  const product = await getProduct(slug);
  if (!product || !product.isActive) return { title: getDictionary(locale).notFound.title, robots: { index: false } };
  const t = getDictionary(locale);
  const name = localName(product, locale);
  // A language without its own product name would show another language's text: keep it out of search results.
  const locales = productLocales(product);
  return pageMetadata({
    locale,
    path: `/product/${slug}`,
    locales,
    noindex: !locales.includes(locale),
    title: product.priceOnRequest
      ? fitTitle(fmt(t.meta.productTitleNoPrice, { name }), `${name} | Stratega`)
      : fitTitle(
          fmt(t.meta.productTitle, { name, price: formatNumber(product.price) }),
          fmt(t.meta.productTitleShort, { name, price: formatNumber(product.price) }),
          `${name} | Stratega`
        ),
    description: productMetaDescription(product, locale, name, localDescription(product, locale) || ""),
    image: product.imageUrl,
  });
}

export default async function ProductPage(props: PageProps<"/[locale]/product/[slug]">) {
  const { locale: rawLocale, slug } = await props.params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const t = getDictionary(locale);
  const lp = (p: string) => localePath(locale, p);

  const product = await getProduct(slug);
  if (!product || !product.isActive) notFound();

  const tokens = product.category.isSparePart ? [] : modelTokens(product);
  const [related, parts] = await Promise.all([
    prisma.product.findMany({
      where: { categoryId: product.categoryId, isActive: true, id: { not: product.id } },
      orderBy: [{ isFeatured: "desc" }, { price: "asc" }],
      take: 4,
    }),
    // Machines: spare parts whose "fits" list mentions this model.
    tokens.length ? prisma.product.findMany({ where: sparePartsWhere(tokens), orderBy: [{ stock: "desc" }, { price: "asc" }], take: 8 }) : Promise.resolve([]),
  ]);

  const name = localName(product, locale);
  const categoryName = localName(product.category, locale);
  const description = localDescription(product, locale);
  const card = toCard(product, locale);
  const discount = product.oldPrice && !product.priceOnRequest ? Math.round(100 - (product.price / product.oldPrice) * 100) : null;
  const warranty = product.warrantyMonths ?? CLAIMS.defaultWarrantyMonths;
  const images = [product.imageUrl, ...product.images].filter((x): x is string => Boolean(x));
  const reviews = product.reviews;
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const url = absoluteUrl(lp(`/product/${product.slug}`));

  // Every product is described, so search engines and AI assistants know its brand, model and specs. A "price on
  // request" item has no offer: Google then shows no price rich result for it, which is accepted. Out-of-stock
  // items are imported to order, hence BackOrder.
  const seoFacts = productFacts(product, locale, 20, description);
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name,
      description: excerpt(description, 500),
      sku: product.sku ?? undefined,
      image: images.map((i) => absoluteUrl(i)),
      brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
      category: categoryName,
      url,
      additionalProperty: seoFacts.length ? seoFacts.map((f) => ({ "@type": "PropertyValue", name: f.name, value: f.value })) : undefined,
      // A Product offer needs a real price; "price on request" items are listed without one.
      offers: product.priceOnRequest ? undefined : {
        "@type": "Offer",
        url,
        priceCurrency: "UZS",
        price: product.price,
        availability: isAvailable(product) ? "https://schema.org/InStock" : "https://schema.org/BackOrder",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: COMPANY.brand },
      },
      ...(avgRating !== null
        ? {
            aggregateRating: { "@type": "AggregateRating", ratingValue: avgRating.toFixed(1), reviewCount: reviews.length },
            review: reviews.slice(0, 5).map((r) => ({
              "@type": "Review",
              author: { "@type": "Person", name: r.authorName },
              reviewRating: { "@type": "Rating", ratingValue: r.rating },
              reviewBody: r.comment,
              datePublished: r.createdAt.toISOString().slice(0, 10),
            })),
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t.common.home, item: absoluteUrl(lp("/")) },
        { "@type": "ListItem", position: 2, name: categoryName, item: absoluteUrl(lp(`/category/${product.category.slug}`)) },
        { "@type": "ListItem", position: 3, name, item: url },
      ],
    },
  ];

  const f = t.focus;

  // Spec table: the filterable fields first, then the free rows.
  const specRows: [string, string][] = [];
  for (const sf of SPEC_FILTERS) {
    const v = product[sf.field];
    if (v !== null && v !== undefined) specRows.push([sf.label[locale], `${formatNumber(v)} ${sf.unit[locale]}`]);
  }
  if (product.weightKg) specRows.push([locale === "ru" ? "Вес" : locale === "en" ? "Weight" : "Og'irligi", `${formatNumber(product.weightKg)} ${locale === "ru" ? "кг" : "kg"}`]);
  for (const r of parseSpecRows(product.specs)) specRows.push([specLabel(r, locale), r.value]);
  const videoId = youTubeId(product.videoUrl);

  const terms: string[] = [warranty ? fmt(f.warrantyLine, { n: warranty }) : f.warrantyContract, f.payBank, f.payCash];
  if (CLAIMS.paymentTermsDays) terms.push(fmt(f.deferral, { n: CLAIMS.paymentTermsDays }));
  if (CLAIMS.installments) terms.push(f.installments);
  if (CLAIMS.tashkentSameDay) terms.push(t.trust.sameDay);
  if (CLAIMS.freeTashkentFrom) terms.push(fmt(t.trust.freeFrom, { amount: formatNumber(CLAIMS.freeTashkentFrom) }));
  if (CLAIMS.deliveryUzbekistan) terms.push(f.deliveryLine);
  if (CLAIMS.didox) terms.push(t.trust.didox);
  terms.push(`${t.trust.shop}: ${COMPANY.shop[locale]}`);

  const facts: [string, string][] = [];
  if (product.sku) facts.push([t.product.sku, product.sku]);
  if (product.brand) facts.push([t.product.brand, product.brand]);
  facts.push([t.product.category, categoryName]);
  if (product.compatibleWith) facts.push([t.parts.fits, product.compatibleWith]);
  if (warranty) facts.push([t.product.warranty, fmt(t.product.warrantyMonths, { n: warranty })]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structuredData.filter(Boolean))} />
      <TrackView productId={product.id} />

      <nav aria-label="breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-slate-500">
        <Link href={lp("/")} className="hover:text-indigo-600">
          {t.common.home}
        </Link>
        <span>/</span>
        <Link href={lp(`/category/${product.category.slug}`)} className="hover:text-indigo-600">
          {categoryName}
        </Link>
        <span>/</span>
        <span className="text-slate-700" aria-current="page">
          {name}
        </span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        {images.length > 0 ? (
          <ProductGallery
            images={images.slice(0, 10)}
            alt={name}
            labels={{ open: t.product.zoomPhoto, close: t.quickOrder.close, previous: t.catalog.previous, next: t.catalog.next }}
            badge={
              discount !== null && discount > 0 ? (
                <span className="absolute left-4 top-4 z-10 rounded-md bg-rose-500 px-2.5 py-1 text-sm font-bold text-white">{fmt(t.product.discount, { n: discount })}</span>
              ) : undefined
            }
          />
        ) : (
          <div className="relative flex aspect-square items-center justify-center rounded-2xl bg-slate-50 p-10">
            <span className="text-6xl" role="img" aria-label={name}>
              📦
            </span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{name}</h1>

          <div>
            <div className="flex flex-wrap items-baseline gap-3">
              {product.priceOnRequest ? (
                <p className="text-3xl font-bold text-indigo-600">{t.product.priceOnRequest}</p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-indigo-600">{formatSum(product.price, locale)}</p>
                  {product.oldPrice && <p className="text-lg text-slate-400 line-through">{formatSum(product.oldPrice, locale)}</p>}
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">{product.priceOnRequest ? t.product.priceOnRequestNote : t.product.priceWithVat}</p>
            <BuyerPriceBox product={card} />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span className={isAvailable(product) ? "font-medium text-emerald-600" : "text-slate-500"}>
              {product.sourcing === "SUPPLIER_STOCK"
                ? t.product.availableNow
                : product.stock > 0
                ? fmt(t.product.inStock, { n: product.stock })
                : product.leadTimeDays
                  ? fmt(f.leadTime, { n: product.leadTimeDays })
                  : t.product.notInStock}
            </span>
            {product.freeDelivery && <span className="font-medium text-emerald-600">🚚 {t.product.freeDelivery}</span>}
          </div>

          <AddToCart product={card} />
          <QuickOrder
            productId={product.id}
            productName={name}
            className="w-full rounded-full border-2 border-indigo-600 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50"
          />

          <div className="rounded-xl border border-slate-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700" aria-hidden="true">
                {COMPANY.seller.name[locale].charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800">{COMPANY.seller.name[locale]}</p>
                <p className="text-xs text-slate-500">
                  {t.trust.seller} · STRATEGA · {t.product.askManager}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`tel:${COMPANY.seller.phoneHref}`} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                📞 {COMPANY.seller.phone}
              </a>
              {COMPANY.seller.telegram && (
                <a href={COMPANY.seller.telegram} target="_blank" rel="noopener" className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400">
                  {t.focus.writeTelegram}
                </a>
              )}
            </div>
          </div>

          {(product.datasheetUrl || product.videoUrl) && (
            <div className="flex flex-wrap gap-2">
              {product.datasheetUrl && (
                <a href={product.datasheetUrl} target="_blank" rel="noopener" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600">
                  📄 {f.datasheet}
                </a>
              )}
              {product.videoUrl && !videoId && (
                <a href={product.videoUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600">
                  ▶ {f.video}
                </a>
              )}
            </div>
          )}

          <dl className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-right font-medium text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <h2 className="font-semibold text-slate-800">{f.termsTitle}</h2>
            <ul className="mt-1.5 space-y-1 text-slate-600">
              {terms.map((x) => (
                <li key={x}>✓ {x}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {specRows.length > 0 && (
        <section className="mt-12 border-t border-slate-200 pt-8">
          <h2 className="mb-4 text-xl font-bold text-slate-800">{f.specTable}</h2>
          <table className="w-full max-w-3xl text-sm">
            <tbody className="divide-y divide-slate-100">
              {specRows.map(([k, v], i) => (
                <tr key={`${k}-${i}`} className="even:bg-slate-50">
                  <th scope="row" className="w-1/2 px-4 py-2.5 text-left font-normal text-slate-500">
                    {k}
                  </th>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {videoId && (
        <section className="mt-12 border-t border-slate-200 pt-8">
          <h2 className="mb-4 text-xl font-bold text-slate-800">{f.video}</h2>
          <div className="aspect-video w-full max-w-3xl overflow-hidden rounded-xl bg-slate-100">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
              title={`${name} — ${f.video}`}
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </section>
      )}

      {description && (
        <section className="mt-12 border-t border-slate-200 pt-8">
          <h2 className="mb-4 text-xl font-bold text-slate-800">{t.product.description}</h2>
          <div className="max-w-3xl whitespace-pre-line leading-relaxed text-slate-700">{description}</div>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="mt-12 border-t border-slate-200 pt-8">
          <h2 className="mb-5 text-xl font-bold text-slate-800">
            {t.product.reviews} · {avgRating!.toFixed(1)} ★ ({reviews.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.id} className="rounded-xl border border-slate-200 p-4">
                <figcaption className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">
                    {r.authorName}
                    {r.company ? `, ${r.company}` : ""}
                  </span>
                  <span className="text-amber-500" aria-label={`${r.rating}/5`}>
                    {"★".repeat(r.rating)}
                    <span className="text-slate-200">{"★".repeat(5 - r.rating)}</span>
                  </span>
                </figcaption>
                <blockquote className="mt-2 text-sm text-slate-600">{r.comment}</blockquote>
              </figure>
            ))}
          </div>
        </section>
      )}

      {parts.length > 0 && (
        <section className="mt-12 border-t border-slate-200 pt-8">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-800">{t.parts.forThisMachine}</h2>
            <Link href={lp(`/ehtiyot-qismlar?q=${encodeURIComponent(tokens[0])}`)} className="text-sm font-medium text-indigo-600">{t.common.viewAll}</Link>
          </div>
          <div className="product-grid grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {parts.map((p) => (
              <ProductCard key={p.id} product={toCard(p, locale)} />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-12 border-t border-slate-200 pt-8">
          <h2 className="mb-5 text-xl font-bold text-slate-800">{t.product.related}</h2>
          <div className="product-grid grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={toCard(p, locale)} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewedSection excludeId={product.id} />
    </div>
  );
}
