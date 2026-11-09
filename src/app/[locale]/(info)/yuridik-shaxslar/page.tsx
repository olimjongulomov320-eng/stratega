import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale, localePath } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { COMPANY, CLAIMS } from "@/lib/site";
import { GuestOnly } from "@/components/guest-only";

export async function generateMetadata(props: PageProps<"/[locale]/yuridik-shaxslar">): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const f = getDictionary(locale).focus;
  return pageMetadata({ locale, path: "/yuridik-shaxslar", title: `${f.b2bTitle} | Stratega`, description: f.b2bLead });
}

export default async function B2bPage(props: PageProps<"/[locale]/yuridik-shaxslar">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const f = t.focus;
  const lp = (p: string) => localePath(locale, p);

  const requisites: [string, string][] = [
    [f.reqName, COMPANY.legalName],
    [f.reqInn, COMPANY.inn],
    [f.reqAddress, COMPANY.address[locale]],
    [f.reqBank, COMPANY.bank],
    [f.reqMfo, COMPANY.mfo],
  ];
  if (COMPANY.bankAccount) requisites.push([f.reqAccount, COMPANY.bankAccount]);

  const terms = [f.payBank, f.payCash];
  if (CLAIMS.paymentTermsDays) terms.push(f.deferral.replace("{n}", String(CLAIMS.paymentTermsDays)));
  if (CLAIMS.installments) terms.push(f.installments);
  if (CLAIMS.deliveryUzbekistan) terms.push(f.deliveryLine);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">{f.b2bTitle}</h1>
      <p className="mt-3 text-lg text-slate-700">{f.b2bLead}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <a href={`/api/price-list?lang=${locale}`} className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
          ⬇ {f.priceList}
        </a>
        <Link href={lp("/korzina")} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          {f.requestOffer}
        </Link>
        <GuestOnly>
          <Link href={lp("/kirish")} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            {f.login}
          </Link>
        </GuestOnly>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {f.b2bItems.map((item) => (
          <div key={item.title} className="rounded-xl border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-800">{item.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{item.text}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-bold text-slate-800">{f.termsTitle}</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-700">
        {terms.map((x) => (
          <li key={x}>{x}</li>
        ))}
        <li>{CLAIMS.defaultWarrantyMonths ? f.warrantyLine.replace("{n}", String(CLAIMS.defaultWarrantyMonths)) : f.warrantyContract}</li>
      </ul>

      <h2 className="mt-10 text-lg font-bold text-slate-800">{f.requisites}</h2>
      <dl className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
        {requisites.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
            <dt className="text-slate-500">{k}</dt>
            <dd className="text-right font-medium text-slate-800">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-slate-500">
        {COMPANY.phone} · {COMPANY.email}
      </p>
    </div>
  );
}
