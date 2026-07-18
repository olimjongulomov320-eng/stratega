type Badge = {
  icon: string;
  title: string;
  subtitle: string;
};

const BADGES: Badge[] = [
  { icon: "✅", title: "CE sertifikati", subtitle: "Xalqaro xavfsizlik standarti" },
  { icon: "🛡️", title: "12 oy kafolat", subtitle: "Barcha shtabelerlarga" },
  { icon: "🔧", title: "Original ehtiyot qismlar", subtitle: "Doimiy mavjud" },
  { icon: "📍", title: "Toshkentda servis markazi", subtitle: "Tez texnik xizmat" },
  { icon: "🚚", title: "O'zbekiston bo'ylab yetkazib berish", subtitle: "Barcha viloyatlarga" },
  { icon: "💯", title: "2000+ dona sotilgan", subtitle: "Ishonchli tajriba" },
];

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <div className="flex h-24 w-64 shrink-0 items-center gap-3 rounded-xl bg-white px-5 shadow-sm ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-md">
      <span className="text-2xl">{badge.icon}</span>
      <div>
        <p className="text-sm font-bold text-slate-800">{badge.title}</p>
        <p className="text-xs text-slate-500">{badge.subtitle}</p>
      </div>
    </div>
  );
}

export function BrandStrip() {
  const loop = [...BADGES, ...BADGES];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <p className="mb-3 text-sm text-slate-500">Sifat va kafolat</p>
      <div className="relative overflow-hidden rounded-2xl bg-slate-50 py-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-slate-50 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-slate-50 to-transparent" />
        <div className="brand-marquee flex w-max gap-4 px-4">
          {loop.map((badge, i) => (
            <BadgeCard key={`${badge.title}-${i}`} badge={badge} />
          ))}
        </div>
      </div>
    </section>
  );
}
