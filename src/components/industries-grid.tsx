import { getTranslations } from "next-intl/server";

const INDUSTRIES = [
  { key: "warehouseLogistics", image: "/products/shtabeler-elektr-avtomat-35m.png" },
  { key: "manufacturing", image: "/products/shtabeler-elektr-avtomat-45m.png" },
  { key: "tradeDistribution", image: "/products/telejka-gidravlik-standart-120sm.png" },
  { key: "packaging", image: "/products/telejka-gidravlik-rulon-180sm.png" },
  { key: "retailChains", image: "/products/telejka-gidravlik-tarozili.png" },
  { key: "importExport", image: "/products/shtabeler-elektr-poluavtomat-3m.png" },
  { key: "constructionWarehouse", image: "/products/shtabeler-gidravlik-qolda-16m.png" },
  { key: "coldStorage", image: "/products/shtabeler-elektr-poluavtomat-16m.png" },
];

export async function IndustriesGrid() {
  const t = await getTranslations("industries");

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h2 className="mb-5 text-xl font-bold text-slate-800">
        {t("headingPrefix")}{" "}
        <span className="text-indigo-600">{t("headingHighlight")}</span>
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {INDUSTRIES.map((industry) => (
          <div
            key={industry.key}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-900"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={industry.image}
              alt={t(industry.key as never)}
              className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white">
              {t(industry.key as never)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
