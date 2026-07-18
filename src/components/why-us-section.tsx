import Link from "next/link";
import type { HeaderCategory } from "@/components/header";

const CATEGORY_COVER: Record<string, string> = {
  "qurilish-texnikasi": "/products/betonomeshalka-200l.jpg",
  "gidravlik-uskunalar": "/products/gidravlichesky-press-30t.jpg",
  "klining-uskunalari": "/products/moyka-vysokogo-davleniya-karcher.jpg",
  "bog-texnikasi": "/products/gazonokosilka-benzin-samohodnaya.jpg",
};

const TRUST_BADGES = [
  {
    icon: "📄",
    title: "NDS va hujjatlar",
    description: "Schyot-faktura, nakladnaya, shartnoma",
  },
  {
    icon: "💳",
    title: "To'lov muddati",
    description: "Doimiy mijozlar uchun 30 kungacha",
  },
  {
    icon: "👤",
    title: "Shaxsiy menejer",
    description: "Barcha savollar bo'yicha ajratilgan aloqa",
  },
];

export function WhyUsSection({
  categories,
}: {
  categories: HeaderCategory[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h2 className="text-xl font-bold text-slate-800">
        Nima uchun bizdan komplektlaysiz
      </h2>
      <p className="mt-1 text-slate-500">
        Qurilish, ishlab chiqarish va ekspluatatsiya uchun professional
        assortiment
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition hover:border-indigo-300 hover:shadow-md"
          >
            <div className="aspect-[4/3] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={CATEGORY_COVER[cat.slug] ?? "/products/perforator-bosch-gbh.jpg"}
                alt={cat.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-slate-800">{cat.name}</h3>
              <span className="text-xs text-slate-400">
                {cat.productCount} ta mahsulot
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {TRUST_BADGES.map((badge) => (
          <div
            key={badge.title}
            className="flex items-start gap-3 rounded-xl border border-slate-200 p-4"
          >
            <span className="text-2xl">{badge.icon}</span>
            <div>
              <h4 className="font-semibold text-slate-800">{badge.title}</h4>
              <p className="text-sm text-slate-500">{badge.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
