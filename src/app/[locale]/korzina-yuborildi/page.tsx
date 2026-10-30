import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatSum, daysAgo } from "@/lib/format";
import { getDictionary } from "@/i18n";
import { isLocale, localePath } from "@/i18n/config";
import { localName } from "@/lib/localize";
import { privatePageMetadata } from "../noindex";

export const generateMetadata = privatePageMetadata("sent");

export default async function SentPage(props: PageProps<"/[locale]/korzina-yuborildi">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const sp = await props.searchParams;
  const id = typeof sp.id === "string" ? sp.id : undefined;
  // Show details only for a request created in the last hour (the id comes from the URL).
  const request = id
    ? await prisma.rfqRequest.findFirst({
        where: { id, createdAt: { gte: daysAgo(1 / 24) } },
        include: { items: { include: { product: true } } },
      })
    : null;
  const total = request?.items.reduce((s, i) => s + i.priceAtQuote * i.quantity, 0) ?? 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl" aria-hidden="true">✓</div>
      <h1 className="mt-6 text-2xl font-bold text-slate-800">{t.cart.sentTitle}</h1>
      <p className="mt-2 text-slate-500">{t.cart.sentText}</p>
      {request && (
        <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-6 text-left">
          <p className="text-sm text-slate-500">
            {t.cart.sentNumber}: <span className="font-mono text-slate-700">{request.id.slice(-8).toUpperCase()}</span>
          </p>
          <ul className="mt-4 space-y-1 text-sm text-slate-600">
            {request.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span>{localName(item.product, locale)} × {item.quantity}</span>
                <span className="shrink-0">{item.priceAtQuote > 0 ? formatSum(item.priceAtQuote * item.quantity, locale) : t.product.priceOnRequest}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold text-slate-900">
            <span>{t.cart.estimated}</span>
            <span>{formatSum(total, locale)}</span>
          </div>
          <p className="mt-4 text-xs text-slate-500">{t.cart.sentCabinet}</p>
        </div>
      )}
      <Link href={localePath(locale, "/search")} className="mt-8 inline-block rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
        {t.common.backToCatalog}
      </Link>
    </div>
  );
}
