import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { InfoPageHeader } from "@/components/info-page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("info");
  return { title: t("returnsTitle") };
}

export default async function ReturnsPage() {
  const t = await getTranslations("info");

  const PROCESS_STEPS = [
    t("processStep1"),
    t("processStep2"),
    t("processStep3"),
    t("processStep4"),
  ];

  return (
    <div>
      <InfoPageHeader
        title={t("returnsHeading")}
        subtitle={t("returnsSubtitle")}
      />

      <div className="flex flex-col gap-8 text-slate-700">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            {t("conditionsHeading")}
          </h2>
          <ul className="flex flex-col gap-2 text-slate-600">
            <li>
              {t("condition1Prefix")}{" "}
              <b className="text-slate-800">{t("condition1Highlight")}</b>{" "}
              {t("condition1Suffix")}
            </li>
            <li>{t("condition2")}</li>
            <li>{t("condition3")}</li>
            <li>{t("condition4")}</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            {t("nonReturnableHeading")}
          </h2>
          <p className="text-slate-600">{t("nonReturnableBody")}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            {t("processHeading")}
          </h2>
          <ol className="flex flex-col gap-3">
            {PROCESS_STEPS.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                  {i + 1}
                </span>
                <span className="text-slate-600">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
