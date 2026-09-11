import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { InfoPageHeader } from "@/components/info-page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("info");
  return { title: t("contactsTitle") };
}

export default async function ContactsPage() {
  const t = await getTranslations("info");

  return (
    <div>
      <InfoPageHeader title={t("contactsHeading")} />

      <div className="grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            {t("contactInfoHeading")}
          </h2>
          <ul className="flex flex-col gap-2.5 text-slate-600">
            <li>
              <span className="text-slate-400">{t("phoneLabel")} </span>
              <a href="tel:+998993011170" className="text-indigo-600 hover:underline">
                +998 99 301 11 70
              </a>
            </li>
            <li>
              <span className="text-slate-400">{t("emailLabel")} </span>
              <a href="mailto:info@stratega.uz" className="text-indigo-600 hover:underline">
                info@stratega.uz
              </a>
            </li>
            <li>
              <span className="text-slate-400">{t("addressLabel")} </span>
              {t("addressValue")}
            </li>
            <li>
              <span className="text-slate-400">{t("hoursLabel")} </span>
              {t("hoursValue")}
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            {t("detailsHeading")}
          </h2>
          <dl className="flex flex-col gap-2 text-sm text-slate-600">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-400">{t("orgNameLabel")}</dt>
              <dd className="text-right font-medium text-slate-800">
                {t("orgNameValue")}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-400">{t("taxIdLabel")}</dt>
              <dd className="text-right font-medium text-slate-800">
                123456789
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-400">{t("accountLabel")}</dt>
              <dd className="text-right font-medium text-slate-800">
                2020 8000 XXXX XXXX
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">{t("legalAddressLabel")}</dt>
              <dd className="text-right font-medium text-slate-800">
                {t("addressValue")}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <p className="mt-8 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
        {t("legalNote")}
      </p>
    </div>
  );
}
