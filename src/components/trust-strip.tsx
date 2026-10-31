import { getDictionary, fmt } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/lib/format";
import { CLAIMS, COMPANY } from "@/lib/site";

/** Delivery, documents and shop facts — each shown only when switched on in the claims config. */
export function trustItems(locale: Locale): { icon: string; text: string }[] {
  const t = getDictionary(locale).trust;
  const items: { icon: string; text: string }[] = [{ icon: "🏢", text: t.b2b }];
  if (CLAIMS.didox) items.push({ icon: "📄", text: t.didoxShort });
  if (CLAIMS.tashkentSameDay)
    items.push({
      icon: "🚚",
      text: CLAIMS.freeTashkentFrom ? `${t.sameDay}, ${fmt(t.freeShort, { amount: formatNumber(CLAIMS.freeTashkentFrom) })}` : t.sameDay,
    });
  items.push({ icon: "🏬", text: `${t.shop}: ${COMPANY.shop[locale]}` });
  return items;
}

export function TrustStrip({ locale }: { locale: Locale }) {
  return (
    <div className="border-b border-slate-100 bg-white">
      <ul className="mx-auto grid max-w-7xl gap-3 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {trustItems(locale).map((i) => (
          <li key={i.text} className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
            <span className="text-xl" aria-hidden="true">
              {i.icon}
            </span>
            <span>{i.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "Visit our shop" block with the address and a map link. */
export function ShopBlock({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-5 rounded-2xl bg-slate-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">INDEX · Toshkent</p>
          <h2 className="mt-1 text-2xl font-bold">{t.trust.shopTitle}</h2>
          <p className="mt-2 max-w-xl text-slate-300">{t.trust.shopText}</p>
          <p className="mt-3 font-semibold">{COMPANY.shop[locale]}</p>
          <p className="text-sm text-slate-400">
            {t.footer.hours}: {COMPANY.hours[locale]}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <a href={COMPANY.shopMapUrl} target="_blank" rel="noopener" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100">
            📍 {t.trust.onMap}
          </a>
          <a href={`tel:${COMPANY.phoneHref}`} className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold hover:bg-white/10">
            📞 {COMPANY.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
