import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { InfoPageHeader } from "@/components/info-page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("info");
  return { title: t("deliveryTitle") };
}

export default async function DeliveryPage() {
  const t = await getTranslations("info");

  const ZONES = [
    { city: t("zoneTashkentCity"), time: t("zoneTime1"), price: t("zonePriceFree") },
    { city: t("zoneTashkentRegion"), time: t("zoneTime2"), price: t("zonePrice1") },
    { city: t("zoneOtherRegions"), time: t("zoneTime3"), price: t("zonePrice2") },
  ];

  const HOW_IT_WORKS = [
    t("howItWorksStep1"),
    t("howItWorksStep2"),
    t("howItWorksStep3"),
    t("howItWorksStep4"),
  ];

  return (
    <div>
      <InfoPageHeader
        title={t("deliveryHeading")}
        subtitle={t("deliverySubtitle")}
      />

      <div className="flex flex-col gap-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            {t("zonesHeading")}
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">{t("zoneRegionHeader")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("zoneTimeHeader")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("zonePriceHeader")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ZONES.map((zone) => (
                  <tr key={zone.city}>
                    <td className="px-4 py-2.5 font-medium text-slate-800">
                      {zone.city}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{zone.time}</td>
                    <td className="px-4 py-2.5 text-slate-600">{zone.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            {t("howItWorksHeading")}
          </h2>
          <ol className="flex flex-col gap-3">
            {HOW_IT_WORKS.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                  {i + 1}
                </span>
                <span className="text-slate-600">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            {t("warrantyHeading")}
          </h2>
          <p className="text-slate-600">{t("warrantyBody")}</p>
        </section>
      </div>
    </div>
  );
}
