import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { localizeProduct } from "@/lib/localize";
import type { AppLocale } from "@/i18n/routing";

export default async function ArizaYuborildiPage(
  props: PageProps<"/[locale]/korzina-yuborildi">
) {
  const searchParams = await props.searchParams;
  const id = typeof searchParams.id === "string" ? searchParams.id : undefined;
  const t = await getTranslations("cartSent");
  const tCommon = await getTranslations("common");
  const locale = (await getLocale()) as AppLocale;

  const request = id
    ? await prisma.rfqRequest.findUnique({
        where: { id },
        include: { items: { include: { product: true } } },
      })
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
        ✓
      </div>
      <h1 className="mt-6 text-2xl font-bold text-slate-800">
        {t("heading")}
      </h1>
      <p className="mt-2 text-slate-500">{t("description")}</p>

      {request && (
        <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-6 text-left">
          <p className="text-sm text-slate-500">
            {t("requestNumberLabel")}{" "}
            <span className="font-mono text-slate-700">{request.id}</span>
          </p>
          <ul className="mt-4 space-y-1 text-sm text-slate-600">
            {request.items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>
                  {localizeProduct(item.product, locale).name} × {item.quantity}
                </span>
                <span>{formatSum(item.priceAtQuote * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold text-slate-900">
            <span>{tCommon("estimatedTotal")}</span>
            <span>
              {formatSum(
                request.items.reduce(
                  (sum, i) => sum + i.priceAtQuote * i.quantity,
                  0
                )
              )}
            </span>
          </div>
        </div>
      )}

      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
      >
        {t("backToCatalog")}
      </Link>
    </div>
  );
}
