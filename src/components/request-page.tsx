import Link from "next/link";
import { localePath, type Locale } from "@/i18n/config";
import { COMPANY } from "@/lib/site";
import { RequestForm } from "@/components/request-form";
import type { DEALER_PAGE } from "@/config/service-pages";

type PageText = (typeof DEALER_PAGE)["ru"];

/** Dealer and service pages: lead, sections, contacts and a request form. */
export function RequestPage({ text, locale, links }: { text: PageText; locale: Locale; links?: { href: string; label: string }[] }) {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">{text.title}</h1>
      <p className="mt-3 text-lg text-slate-700">{text.lead}</p>
      {text.sections.map((s) => (
        <section key={s.h2}>
          <h2 className="mt-8 text-lg font-semibold text-slate-800">{s.h2}</h2>
          {s.p && <p className="mt-3 leading-relaxed text-slate-600">{s.p}</p>}
          {s.ul && (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-600">
              {s.ul.map((i) => <li key={i}>{i}</li>)}
            </ul>
          )}
          {s.ol && (
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-600">
              {s.ol.map((i) => <li key={i}>{i}</li>)}
            </ol>
          )}
        </section>
      ))}
      {links && links.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {links.map((l) => (
            <Link key={l.href} href={localePath(locale, l.href)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600">
              {l.label} →
            </Link>
          ))}
        </div>
      )}
      <section className="mt-10 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-slate-800">{text.formTitle}</h2>
        <p className="mt-1 text-sm text-slate-600">
          📞 <a href={`tel:${COMPANY.phoneHref}`} className="font-semibold text-indigo-700">{COMPANY.phone}</a>
          {COMPANY.messengers.telegram && (
            <>
              {" · "}
              <a href={COMPANY.messengers.telegram} target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-700">Telegram</a>
            </>
          )}
        </p>
        <div className="mt-4">
          <RequestForm text={text.form} />
        </div>
      </section>
    </div>
  );
}
