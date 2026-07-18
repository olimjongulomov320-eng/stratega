const INDUSTRIES = [
  { name: "Ombor va logistika", image: "/products/shtabeler-elektr-avtomat-35m.png" },
  { name: "Ishlab chiqarish", image: "/products/shtabeler-elektr-avtomat-45m.png" },
  { name: "Savdo va distribyutsiya", image: "/products/telejka-gidravlik-standart-120sm.png" },
  { name: "Qadoqlash sanoati", image: "/products/telejka-gidravlik-rulon-180sm.png" },
  { name: "Chakana savdo tarmoqlari", image: "/products/telejka-gidravlik-tarozili.png" },
  { name: "Import-eksport terminallari", image: "/products/shtabeler-elektr-poluavtomat-3m.png" },
  { name: "Qurilish materiallari ombori", image: "/products/shtabeler-gidravlik-qolda-16m.png" },
  { name: "Sovutgichlar va omborxonalar", image: "/products/shtabeler-elektr-poluavtomat-16m.png" },
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
            className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-900"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={industry.image}
              alt={industry.name}
              className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white">
              {industry.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
