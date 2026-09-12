import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { LogoutButton } from "@/components/logout-button";
import { localizeProduct } from "@/lib/localize";
import type { AppLocale } from "@/i18n/routing";

const STATUS_CLASSNAMES: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700",
  IN_REVIEW: "bg-amber-50 text-amber-700",
  QUOTED: "bg-indigo-50 text-indigo-700",
  CONFIRMED: "bg-green-50 text-green-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default async function KabinetPage() {
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) {
    return redirect({
      href: { pathname: "/kirish", query: { redirect: "/kabinet" } },
      locale,
    });
  }

  const t = await getTranslations("kabinet");
  const tStatus = await getTranslations("requestStatus");
  const tCommon = await getTranslations("common");

  const requests = await prisma.rfqRequest.findMany({
    where: { userId: user.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {t("heading")}
          </h1>
          <p className="mt-1 text-slate-500">
            {user.companyName ?? t("companyNamePlaceholder")} ·{" "}
            {user.phone}
          </p>
        </div>
        <LogoutButton />
      </div>

      <h2 className="mt-10 mb-4 text-lg font-semibold text-slate-800">
        {t("myRequests")}
      </h2>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-4xl">📋</p>
          <p className="mt-3 text-slate-500">{t("empty")}</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {tCommon("goToCatalog")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((request) => {
            const statusClassName =
              STATUS_CLASSNAMES[request.status] ?? STATUS_CLASSNAMES.NEW;
            const total = request.items.reduce(
              (sum, i) => sum + i.priceAtQuote * i.quantity,
              0
            );
            return (
              <div
                key={request.id}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-slate-400">
                      {request.id}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(request.createdAt).toLocaleDateString(locale)}{" "}
                      · {request.requestType}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName}`}
                  >
                    {tStatus(request.status as never)}
                  </span>
                </div>

                <ul className="mt-3 space-y-1 text-sm text-slate-600">
                  {request.items.map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>
                        {localizeProduct(item.product, locale as AppLocale).name} × {item.quantity}
                      </span>
                      <span>{formatSum(item.priceAtQuote * item.quantity)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-semibold text-slate-800">
                  <span>{tCommon("estimatedTotal")}</span>
                  <span>{formatSum(total)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
