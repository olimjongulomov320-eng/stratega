const BRANDS = [
  "BOSCH",
  "MAKITA",
  "KARCHER",
  "HONDA",
  "DEWALT",
  "HUSQVARNA",
  "STIHL",
  "HITACHI",
];

export function BrandStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <p className="mb-3 text-sm text-slate-500">Ishonchli brendlar</p>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-6 py-6">
        {BRANDS.map((brand) => (
          <span
            key={brand}
            className="rounded-lg bg-white px-5 py-3 text-sm font-black tracking-wide text-slate-400 shadow-sm"
          >
            {brand}
          </span>
        ))}
      </div>
    </section>
  );
}
