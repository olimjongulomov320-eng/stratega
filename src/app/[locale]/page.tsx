import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { RecentlyViewedSection } from "@/components/recently-viewed-section";
import { HeroQuickRfqForm } from "@/components/hero-quick-rfq-form";
import { OrderFlowShowcase } from "@/components/order-flow-showcase";
import {
  TelegramIcon,
  InstagramIcon,
  YouTubeIcon,
  FacebookIcon,
} from "@/components/social-icons";
import { getHeaderCategories, directionsFrom } from "@/lib/categories";
import { getFocus } from "@/lib/focus";
import { getDictionary, fmt } from "@/i18n";
import { isLocale, localePath, LOCALE_TAGS } from "@/i18n/config";
import { toCard, sortToOrderBy } from "@/lib/products";
import { pageMetadata, absoluteUrl, jsonLd } from "@/lib/seo";
import { COMPANY, CLAIMS, TRUST_BADGES, SITE_URL } from "@/lib/site";
import { ProductImage } from "@/components/product-image";

export async function generateMetadata(
  props: PageProps<"/[locale]">,
): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return pageMetadata({
    locale,
    path: "/",
    title: t.meta.homeTitle,
    description: t.meta.homeDescription,
  });
}

const SOCIALS = [
  {
    name: "Telegram",
    handle: "@stratega_uz",
    Icon: TelegramIcon,
    href: COMPANY.socials.telegram,
  },
  {
    name: "Instagram",
    handle: "@stratega.uz",
    Icon: InstagramIcon,
    href: COMPANY.socials.instagram,
  },
  {
    name: "YouTube",
    handle: "@stratega_uz",
    Icon: YouTubeIcon,
    href: COMPANY.socials.youtube,
  },
  {
    name: "Facebook",
    handle: "stratega.uz",
    Icon: FacebookIcon,
    href: COMPANY.socials.facebook,
  },
];

export default async function Home(props: PageProps<"/[locale]">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const lp = (p: string) => localePath(locale, p);

  const [categories, featured, inStockModels, covers] = await Promise.all([
    getHeaderCategories(locale),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: sortToOrderBy("popular"),
      take: 8,
    }),
    prisma.product.count({ where: { isActive: true, stock: { gt: 0 } } }),
    prisma.product.findMany({
      where: { isActive: true, imageUrl: { not: null } },
      select: { categoryId: true, imageUrl: true },
      orderBy: [{ isFeatured: "desc" }, { price: "desc" }],
    }),
  ]);
  const directions = directionsFrom(categories, locale);
  // Categories inside a direction are reached through the direction cards; list only the rest.
  const otherCategories = categories.filter(
    (c) => !directions.some((d) => d.categorySlugs.includes(c.slug)),
  );
  const coverByCategory = new Map<string, string>();
  for (const c of covers)
    if (c.imageUrl && !coverByCategory.has(c.categoryId))
      coverByCategory.set(c.categoryId, c.imageUrl);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: COMPANY.brand,
      legalName: COMPANY.legalName,
      url: SITE_URL,
      logo: absoluteUrl("/logo.png"),
      telephone: COMPANY.phone,
      email: COMPANY.email,
      taxID: COMPANY.inn,
      address: {
        "@type": "PostalAddress",
        streetAddress: COMPANY.address[locale],
        addressLocality: COMPANY.city,
        addressCountry: COMPANY.country,
      },
      sameAs: Object.values(COMPANY.socials),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: absoluteUrl(lp("/")),
      name: "Stratega",
      inLanguage: LOCALE_TAGS[locale],
      potentialAction: {
        "@type": "SearchAction",
        target: `${absoluteUrl(lp("/search"))}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(structuredData)}
      />

      <section className="relative overflow-hidden bg-slate-950">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(220,38,38,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.35) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-[1.2fr_1fr] lg:py-20">
          <div className="flex flex-col justify-center">
            <span className="w-fit rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300">
              {t.home.badge}
            </span>
            <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {t.home.heroTitle}{" "}
              <span className="text-indigo-400">{t.home.heroAccent}</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-300">
              {t.home.heroText}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={lp("/korzina")}
                className="rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500"
              >
                {t.home.sendSpec}
              </Link>
              <Link
                href={lp("/search")}
                className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                {t.home.viewCatalog}
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-8">
              {inStockModels > 0 && (
                <div>
                  <p className="text-3xl font-black text-white">
                    {inStockModels}
                  </p>
                  <p className="text-sm text-slate-400">{t.home.statModels}</p>
                </div>
              )}
              {CLAIMS.vatDocuments && (
                <div>
                  <p className="text-3xl font-black text-white">
                    {t.home.statVat}
                  </p>
                  <p className="text-sm text-slate-400">{t.home.statVatText}</p>
                </div>
              )}
              {CLAIMS.unitsSold ? (
                <div>
                  <p className="text-3xl font-black text-white">
                    {CLAIMS.unitsSold}+
                  </p>
                  <p className="text-sm text-slate-400">{t.home.statSold}</p>
                </div>
              ) : CLAIMS.deliveryUzbekistan ? (
                <div>
                  <p className="text-3xl font-black text-white">14</p>
                  <p className="text-sm text-slate-400">
                    {t.home.statDelivery} — {t.home.statDeliveryText}
                  </p>
                </div>
              ) : null}
            </div>
            {TRUST_BADGES.some((b) => b.on) && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {TRUST_BADGES.filter((b) => b.on).map((b) => (
                  <li key={b.icon} className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">
                    <span aria-hidden="true">{b.icon}</span> {b.text[locale]}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-center">
            <HeroQuickRfqForm />
          </div>
        </div>
      </section>

      <div className="bg-indigo-600">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px sm:grid-cols-4">
          {SOCIALS.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-4 py-3 text-white transition hover:bg-white/10 sm:px-6"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition group-hover:bg-white/20">
                <s.Icon className="h-4.5 w-4.5" />
              </span>
              <span>
                <span className="block text-xs font-semibold">{s.name}</span>
                <span className="block text-xs text-indigo-100">
                  {s.handle}
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>

      {directions.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
          <h2 className="text-xl font-bold text-slate-800">{t.focus.title}</h2>
          <p className="mt-1 text-slate-500">{t.focus.text}</p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {directions.map((d) => {
              const idOf = new Map(categories.map((c) => [c.slug, c.id]));
              const cover = d.categorySlugs
                .map((s) => coverByCategory.get(idOf.get(s) ?? ""))
                .find(Boolean);
              return (
                <Link
                  key={d.slug}
                  href={lp(`/yonalish/${d.slug}`)}
                  className="group flex overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="flex w-28 shrink-0 items-center justify-center bg-slate-50">
                    {cover ? (
                      <span className="block h-24 w-24 p-2">
                        <ProductImage src={cover} alt={d.name} sizes="96px" className="transition duration-300 group-hover:scale-105" />
                      </span>
                    ) : (
                      <span className="text-4xl" aria-hidden="true">
                        {d.icon}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600">
                      {d.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {getFocus(d.slug)?.tagline[locale]}
                    </p>
                    <span className="mt-2 block text-xs text-slate-400">
                      {fmt(t.focus.models, { n: d.productCount })}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {otherCategories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="text-xl font-bold text-slate-800">
            {directions.length > 0
              ? t.focus.otherCategories
              : t.home.categoriesTitle}
          </h2>
          {directions.length === 0 && (
            <p className="mt-1 text-slate-500">{t.home.categoriesText}</p>
          )}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {otherCategories.map((cat) => {
              const cover = coverByCategory.get(cat.id);
              return (
                <Link
                  key={cat.id}
                  href={lp(`/category/${cat.slug}`)}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-100">
                    {cover ? (
                      <span className="block h-full w-full p-6">
                        <ProductImage src={cover} alt={cat.name} sizes="(min-width: 1024px) 25vw, 50vw" className="transition duration-300 group-hover:scale-105" />
                      </span>
                    ) : (
                      <span className="text-6xl" aria-hidden="true">
                        {cat.icon ?? "📦"}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-800">{cat.name}</h3>
                    <span className="text-xs text-slate-400">
                      {fmt(t.common.productsCount, { n: cat.productCount })}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            {t.home.featured}
          </h2>
          <Link
            href={lp("/search")}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            {t.common.viewAll}
          </Link>
        </div>
        <div className="product-grid grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((p, i) => (
            <ProductCard
              key={p.id}
              product={toCard(p, locale)}
              priority={i < 4}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="text-xl font-bold text-slate-800">{t.home.whyTitle}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.home.whyItems.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-xl border border-slate-200 p-4"
            >
              <span className="text-2xl" aria-hidden="true">
                {item.icon}
              </span>
              <div>
                <h3 className="font-semibold text-slate-800">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <h2 className="mb-5 text-xl font-bold text-slate-800">
          {t.home.industriesTitle}
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {t.home.industries.map((name) => (
            <li
              key={name}
              className="rounded-xl bg-slate-900 px-4 py-5 text-sm font-semibold text-white"
            >
              {name}
            </li>
          ))}
        </ul>
      </section>

      <OrderFlowShowcase />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <RecentlyViewedSection />
      </div>
    </div>
  );
}
