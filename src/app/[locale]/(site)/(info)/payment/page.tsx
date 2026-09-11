import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { InfoPageHeader } from "@/components/info-page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("info");
  return { title: t("paymentTitle") };
}

export default async function PaymentPage() {
  const t = await getTranslations("info");

  const METHODS = [
    { name: t("cashMethod"), description: t("cashDesc"), status: t("statusActive"), active: true },
    { name: t("paymeMethod"), description: t("paymeDesc"), status: t("statusSoon"), active: false },
    { name: t("clickMethod"), description: t("clickDesc"), status: t("statusSoon"), active: false },
    { name: t("cardMethod"), description: t("cardDesc"), status: t("statusSoon"), active: false },
  ];

  return (
    <div>
      <InfoPageHeader
        title={t("paymentHeading")}
        subtitle={t("paymentSubtitle")}
      />

      <div className="flex flex-col gap-3">
        {METHODS.map((method) => (
          <div
            key={method.name}
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
          >
            <div>
              <h3 className="font-semibold text-slate-800">{method.name}</h3>
              <p className="mt-0.5 text-sm text-slate-500">
                {method.description}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                method.active
                  ? "bg-green-50 text-green-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {method.status}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-slate-500">{t("paymentFooter")}</p>
    </div>
  );
}
