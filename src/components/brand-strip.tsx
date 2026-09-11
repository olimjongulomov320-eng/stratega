import { getTranslations } from "next-intl/server";

type Badge = {
  icon: string;
  titleKey: string;
  subtitleKey: string;
};

const BADGES: Badge[] = [
  { icon: "✅", titleKey: "ceTitle", subtitleKey: "ceDesc" },
  { icon: "🛡️", titleKey: "warrantyTitle", subtitleKey: "warrantyDesc" },
  { icon: "🔧", titleKey: "partsTitle", subtitleKey: "partsDesc" },
  { icon: "📍", titleKey: "serviceTitle", subtitleKey: "serviceDesc" },
  { icon: "🚚", titleKey: "deliveryTitle", subtitleKey: "deliveryDesc" },
  { icon: "💯", titleKey: "soldTitle", subtitleKey: "soldDesc" },
];

function BadgeCard({
  badge,
  t,
}: {
  badge: Badge;
  t: (key: string) => string;
}) {
  return (
    <div className="flex h-24 w-64 shrink-0 items-center gap-3 rounded-xl bg-white px-5 shadow-sm ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-md">
      <span className="text-2xl">{badge.icon}</span>
      <div>
        <p className="text-sm font-bold text-slate-800">{t(badge.titleKey)}</p>
        <p className="text-xs text-slate-500">{t(badge.subtitleKey)}</p>
      </div>
    </div>
  );
}

export async function BrandStrip() {
  const t = await getTranslations("brandStrip");
  const loop = [...BADGES, ...BADGES];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <p className="mb-3 text-sm text-slate-500">{t("heading")}</p>
      <div className="relative overflow-hidden rounded-2xl bg-slate-50 py-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-slate-50 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-slate-50 to-transparent" />
        <div className="brand-marquee flex w-max gap-4 px-4">
          {loop.map((badge, i) => (
            <BadgeCard key={`${badge.titleKey}-${i}`} badge={badge} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
