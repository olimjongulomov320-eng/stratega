import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatSum, formatDate } from "@/lib/format";
import { LogoutButton } from "@/components/logout-button";
import { getDictionary } from "@/i18n";
import { isLocale, localePath } from "@/i18n/config";
import { localName } from "@/lib/localize";
import { privatePageMetadata } from "../noindex";

export const generateMetadata = privatePageMetadata("cabinet");

const STATUS_CLASS: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700",
  IN_REVIEW: "bg-amber-50 text-amber-700",
  QUOTED: "bg-indigo-50 text-indigo-700",
  CONFIRMED: "bg-green-50 text-green-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default async function KabinetPage(props: PageProps<"/[locale]/kabinet">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const lp = (p: string) => localePath(locale, p);
  const user = await getCurrentUser();
  if (!user) redirect(`${lp("/kirish")}?redirect=${encodeURIComponent(lp("/kabinet"))}`);

  const requests = await prisma.rfqRequest.findMany({
    where: { userId: user.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t.common.cabinet}</h1>
          <p className="mt-1 text-slate-500">{user.companyName ?? t.cabinet.noCompany} · {user.phone}</p>
        </div>
        <LogoutButton label={t.common.logout} homeHref={lp("/")} />
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold text-slate-800">{t.common.myRequests}</h2>
      {requests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-slate-500">{t.cabinet.empty}</p>
          <Link href={lp("/search")} className="mt-4 inline-block rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            {t.common.backToCatalog}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((r) => {
            const total = r.items.reduce((s, i) => s + i.priceAtQuote * i.quantity, 0);
            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-slate-400">#{r.id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm text-slate-500">{formatDate(r.createdAt)} · {r.requestType}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASS[r.status]}`}>{t.cabinet.status[r.status]}</span>
                </div>
                {r.items.length > 0 && (
                  <>
                    <ul className="mt-3 space-y-1 text-sm text-slate-600">
                      {r.items.map((i) => (
                        <li key={i.id} className="flex justify-between gap-4">
                          <span>{localName(i.product, locale)} × {i.quantity}</span>
                          <span className="shrink-0">{formatSum(i.priceAtQuote * i.quantity, locale)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-semibold text-slate-800">
                      <span>{t.cabinet.estimated}</span>
                      <span>{formatSum(total, locale)}</span>
                    </div>
                  </>
                )}
                {r.comment && <p className="mt-3 text-sm text-slate-500">{r.comment}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
