import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { InfoPageHeader } from "@/components/info-page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("info");
  return { title: t("faqTitle") };
}

export default async function FaqPage() {
  const t = await getTranslations("info");

  const FAQS = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
    { q: t("faq6Q"), a: t("faq6A") },
    { q: t("faq7Q"), a: t("faq7A") },
  ];

  return (
    <div>
      <InfoPageHeader
        title={t("faqHeading")}
        subtitle={t("faqSubtitle")}
      />

      <div className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200">
        {FAQS.map((item) => (
          <details key={item.q} className="group p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-slate-800">
              {item.q}
              <span className="shrink-0 text-slate-400 transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-2 text-sm text-slate-600">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
