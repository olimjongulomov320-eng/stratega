import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { jsonLd } from "@/lib/seo";
import { infoMetadata } from "../meta";

export const generateMetadata = (props: PageProps<"/[locale]/faq">) => infoMetadata(props.params, "faq");

export default async function FaqPage(props: PageProps<"/[locale]/faq">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  const p = getDictionary(locale).info.faq;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: p.items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
  return (
    <div className="max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structuredData)} />
      <h1 className="text-2xl font-bold text-slate-900">{p.title}</h1>
      <p className="mt-3 text-slate-600">{p.lead}</p>
      <div className="mt-6 flex flex-col gap-2">
        {p.items.map((i) => (
          <details key={i.q} className="group rounded-xl border border-slate-200 p-4 open:bg-slate-50">
            <summary className="cursor-pointer list-none font-semibold text-slate-800">
              <span className="mr-2 inline-block text-indigo-600 transition group-open:rotate-45">+</span>
              {i.q}
            </summary>
            <p className="mt-2 pl-6 text-slate-600">{i.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
