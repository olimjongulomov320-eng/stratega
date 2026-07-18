const INDUSTRIES = [
  { name: "Qurilish", image: "/products/betonomeshalka-500l.jpg" },
  { name: "Sanoat va ishlab chiqarish", image: "/products/svarochny-apparat-invertor.jpg" },
  { name: "Kommunal xizmatlar", image: "/products/moyka-vysokogo-davleniya-karcher.jpg" },
  { name: "Qishloq xo'jaligi", image: "/products/motoblok-benzinovy.jpg" },
  { name: "Gidravlik tizimlar", image: "/products/gidrostanciya-mobilnaya.jpg" },
  { name: "Yo'l qurilishi", image: "/products/vibroplita-hcd90.jpg" },
  { name: "Klining kompaniyalari", image: "/products/pylesos-promyshlenny-vodopyl.jpg" },
  { name: "Bog' va landshaft", image: "/products/gazonokosilka-benzin-samohodnaya.jpg" },
];

export function IndustriesGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h2 className="mb-5 text-xl font-bold text-slate-800">
        Yechimlarimiz qo&apos;llaniladigan{" "}
        <span className="text-indigo-600">sohalar</span>
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {INDUSTRIES.map((industry) => (
          <div
            key={industry.name}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={industry.image}
              alt={industry.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
            <span className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white">
              {industry.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
