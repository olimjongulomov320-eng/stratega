type Brand = {
  name: string;
  font: string;
  color: string;
  tracking?: string;
  italic?: boolean;
};

const BRANDS: Brand[] = [
  { name: "BOSCH", font: "font-black", color: "#e2001a", tracking: "tracking-tight" },
  { name: "Makita", font: "font-black italic", color: "#0089cf", italic: true },
  { name: "Kärcher", font: "font-black", color: "#ffb200" },
  { name: "HONDA", font: "font-black", color: "#cc0000", tracking: "tracking-wide" },
  { name: "DEWALT", font: "font-black", color: "#febd17", tracking: "tracking-tight" },
  { name: "HUSQVARNA", font: "font-bold", color: "#273a90", tracking: "tracking-wide" },
  { name: "STIHL", font: "font-black", color: "#ff6600", tracking: "tracking-tight" },
  { name: "HITACHI", font: "font-black", color: "#e60027", tracking: "tracking-wide" },
];

function BrandLogo({ brand }: { brand: Brand }) {
  return (
    <div
      className={`flex h-16 w-40 shrink-0 items-center justify-center rounded-xl bg-white px-6 shadow-sm ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-md ${brand.tracking ?? ""}`}
    >
      <span
        className={`${brand.font} text-lg`}
        style={{
          color: brand.color,
          fontStyle: brand.italic ? "italic" : "normal",
        }}
      >
        {brand.name}
      </span>
    </div>
  );
}

export function BrandStrip() {
  const loop = [...BRANDS, ...BRANDS];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <p className="mb-3 text-sm text-slate-500">Ishonchli brendlar</p>
      <div className="relative overflow-hidden rounded-2xl bg-slate-50 py-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-slate-50 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-slate-50 to-transparent" />
        <div className="brand-marquee flex w-max gap-4 px-4">
          {loop.map((brand, i) => (
            <BrandLogo key={`${brand.name}-${i}`} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
}
