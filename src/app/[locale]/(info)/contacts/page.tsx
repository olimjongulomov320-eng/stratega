import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { COMPANY } from "@/lib/site";
import { infoMetadata } from "../meta";

export const generateMetadata = (props: PageProps<"/[locale]/contacts">) => infoMetadata(props.params, "contacts");

export default async function ContactsPage(props: PageProps<"/[locale]/contacts">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const p = t.info.contacts;
  const rows: [string, string][] = [
    [p.legalName, COMPANY.legalName],
    [p.inn, COMPANY.inn],
    [p.bank, COMPANY.bank],
    [p.mfo, COMPANY.mfo],
    ...(COMPANY.bankAccount ? ([[p.account, COMPANY.bankAccount]] as [string, string][]) : []),
    [p.legalAddress, COMPANY.address[locale]],
  ];
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">{p.title}</h1>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800">{p.contactTitle}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              {t.footer.phone}: <a className="font-medium text-indigo-600" href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phone}</a>,{" "}
              <a className="font-medium text-indigo-600" href={`tel:${COMPANY.phone2Href}`}>{COMPANY.phone2}</a>
            </li>
            <li>Email: <a className="font-medium text-indigo-600" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></li>
            <li>
              {t.trust.shop}: <span className="font-medium text-slate-800">{COMPANY.shop[locale]}</span> ·{" "}
              <a className="text-indigo-600" href={COMPANY.shopMapUrl} target="_blank" rel="noopener">{t.trust.onMap}</a>
            </li>
            <li>{t.footer.address}: {COMPANY.address[locale]}</li>
            <li>{t.footer.hours}: {COMPANY.hours[locale]}</li>
            <li>Telegram: <a className="font-medium text-indigo-600" href={COMPANY.socials.telegram}>@stratega_uz</a></li>
          </ul>
        </section>
        <section className="rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800">{p.detailsTitle}</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-medium text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      <p className="mt-6 text-sm text-slate-500">{p.note}</p>
    </div>
  );
}
