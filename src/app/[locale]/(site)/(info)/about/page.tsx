import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { InfoPageHeader } from "@/components/info-page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("info");
  return { title: t("aboutTitle") };
}

export default async function AboutPage() {
  const t = await getTranslations("info");

  return (
    <div>
      <InfoPageHeader title={t("aboutHeading")} subtitle={t("aboutSubtitle")} />

      <div className="flex flex-col gap-6 text-slate-700">
        <p>{t("aboutBody")}</p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-bold text-indigo-600">8</p>
            <p className="mt-1 text-sm text-slate-500">{t("statModels")}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-bold text-indigo-600">2000+</p>
            <p className="mt-1 text-sm text-slate-500">{t("statSold")}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-bold text-indigo-600">12</p>
            <p className="mt-1 text-sm text-slate-500">{t("statWarranty")}</p>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            {t("principlesHeading")}
          </h2>
          <ul className="flex flex-col gap-2 text-slate-600">
            <li>{t("principle1")}</li>
            <li>{t("principle2")}</li>
            <li>{t("principle3")}</li>
            <li>{t("principle4")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
