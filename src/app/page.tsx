import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { getCategories } from "@/lib/categories";
import { RecentlyViewedSection } from "@/components/recently-viewed-section";
import { HeroQuickRfqForm } from "@/components/hero-quick-rfq-form";
import { WhyUsSection } from "@/components/why-us-section";
import { BrandStrip } from "@/components/brand-strip";
import { IndustriesGrid } from "@/components/industries-grid";
import { TechShowcase } from "@/components/tech-showcase";
import { OrderFlowShowcase } from "@/components/order-flow-showcase";
import {
  TelegramIcon,
  InstagramIcon,
  YouTubeIcon,
  FacebookIcon,
} from "@/components/social-icons";

const SOCIALS = [
  { name: "Telegram", handle: "@stratega_uz", Icon: TelegramIcon, href: "https://t.me/stratega_uz" },
  { name: "Instagram", handle: "@stratega.uz", Icon: InstagramIcon, href: "https://instagram.com/stratega.uz" },
  { name: "YouTube", handle: "@stratega_uz", Icon: YouTubeIcon, href: "https://youtube.com/@stratega_uz" },
  { name: "Facebook", handle: "stratega.uz", Icon: FacebookIcon, href: "https://facebook.com/stratega.uz" },
];

export default async function Home() {
  const [categories, popularProducts] = await Promise.all([
    getCategories(),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { soldCount: "desc" },
      take: 12,
    }),
  ]);

  const headerCategories = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    productCount: c._count.products,
  }));

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.2fr_1fr] md:py-20">
          <div className="flex flex-col justify-center">
            <span className="w-fit rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300">
              ● B2B ta&apos;minot platformasi
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
              Qurilish va sanoat texnikasi{" "}
              <span className="text-indigo-400">biznes va loyihalar</span>{" "}
              uchun
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-300">
              Ob&apos;ektlarni komplektlaymiz. NDS, hujjatlar to&apos;liq
              paketi va spetsifikatsiya bo&apos;yicha yetkazib berish bilan
              ishlaymiz.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/korzina"
                className="rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500"
              >
                📋 Spetsifikatsiya yuborish
              </Link>
              <Link
                href="/search"
                className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Katalogni ko&apos;rish →
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-8">
              <div>
                <p className="text-3xl font-black text-white">200+</p>
                <p className="text-sm text-slate-400">mijoz-kompaniyalar</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white">30+</p>
                <p className="text-sm text-slate-400">uskuna turi</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white">NDS</p>
                <p className="text-sm text-slate-400">to&apos;liq hujjatlar</p>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <HeroQuickRfqForm />
          </div>
        </div>
      </section>

      {/* Socials strip */}
      <div className="bg-indigo-600">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px sm:grid-cols-4">
          {SOCIALS.map((social) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-4 py-3 text-white transition hover:bg-white/10 sm:px-6"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-white/20 group-hover:scale-110">
                <social.Icon className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-xs font-semibold">{social.name}</p>
                <p className="text-xs text-indigo-100">{social.handle}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      <WhyUsSection categories={headerCategories} />

      {/* Popular products */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Top xaridlar</h2>
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
          <div className="product-grid grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
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

      <BrandStrip />

      <IndustriesGrid />

      <TechShowcase />

      <OrderFlowShowcase />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <RecentlyViewedSection />
      </div>
    </div>
  );
}
