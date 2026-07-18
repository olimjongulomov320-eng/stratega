const INDUSTRIES = [
  { name: "Ombor va logistika", image: "/products/shtabeler-elektr-avtomat-35m.jpg" },
  { name: "Ishlab chiqarish", image: "/products/shtabeler-elektr-avtomat-45m.jpg" },
  { name: "Savdo va distribyutsiya", image: "/products/telejka-gidravlik-standart-120sm.jpg" },
  { name: "Qadoqlash sanoati", image: "/products/telejka-gidravlik-rulon-180sm.jpg" },
  { name: "Chakana savdo tarmoqlari", image: "/products/telejka-gidravlik-tarozili.jpg" },
  { name: "Import-eksport terminallari", image: "/products/shtabeler-elektr-poluavtomat-3m.jpg" },
  { name: "Qurilish materiallari ombori", image: "/products/shtabeler-gidravlik-qolda-16m.jpg" },
  { name: "Sovutgichlar va omborxonalar", image: "/products/shtabeler-elektr-poluavtomat-16m.jpg" },
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
