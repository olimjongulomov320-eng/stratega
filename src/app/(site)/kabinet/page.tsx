import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { LogoutButton } from "@/components/logout-button";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  NEW: { label: "Yangi", className: "bg-blue-50 text-blue-700" },
  IN_REVIEW: { label: "Ko'rib chiqilmoqda", className: "bg-amber-50 text-amber-700" },
  QUOTED: { label: "Narx taqdim etildi", className: "bg-indigo-50 text-indigo-700" },
  CONFIRMED: { label: "Tasdiqlandi", className: "bg-green-50 text-green-700" },
  CANCELLED: { label: "Bekor qilindi", className: "bg-slate-100 text-slate-500" },
};

export default async function KabinetPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish?redirect=/kabinet");

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
            Shaxsiy kabinet
          </h1>
          <p className="mt-1 text-slate-500">
            {user.companyName ?? "Kompaniya nomi ko'rsatilmagan"} ·{" "}
            {user.phone}
          </p>
        </div>
        <LogoutButton />
      </div>

      <h2 className="mt-10 mb-4 text-lg font-semibold text-slate-800">
        Mening arizalarim
      </h2>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-4xl">📋</p>
          <p className="mt-3 text-slate-500">
            Hozircha arizalar mavjud emas.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Katalogga o&apos;tish
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((request) => {
            const status = STATUS_LABELS[request.status] ?? STATUS_LABELS.NEW;
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
                      {new Date(request.createdAt).toLocaleDateString("uz-UZ")}{" "}
                      · {request.requestType}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                <ul className="mt-3 space-y-1 text-sm text-slate-600">
                  {request.items.map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>
                        {item.product.name} × {item.quantity}
                      </span>
                      <span>{formatSum(item.priceAtQuote * item.quantity)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-semibold text-slate-800">
                  <span>Taxminiy summa</span>
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
