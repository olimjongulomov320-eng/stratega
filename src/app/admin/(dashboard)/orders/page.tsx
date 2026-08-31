import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatSum } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Qoralama",
  CONFIRMED: "Tasdiqlandi",
  PROCESSING: "Tayyorlanmoqda",
  READY_TO_SHIP: "Jo'natishga tayyor",
  SHIPPED: "Jo'natildi",
  COMPLETED: "Yakunlandi",
  CANCELLED: "Bekor qilindi",
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  CONFIRMED: "bg-indigo-50 text-indigo-700",
  PROCESSING: "bg-amber-50 text-amber-700",
  READY_TO_SHIP: "bg-amber-50 text-amber-700",
  SHIPPED: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700",
};

export default async function OrdersPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { companyName: true } },
      warehouse: { select: { name: true } },
      items: { select: { quantity: true, price: true } },
    },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Buyurtmalar</h1>
          <p className="mt-1 text-slate-500">
            Mijozlar bilan bo&apos;lgan barcha buyurtmalar.
          </p>
        </div>
        <Link
          href="/admin/orders/new"
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + Yangi buyurtma
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Raqam</th>
              <th className="px-4 py-3">Mijoz</th>
              <th className="px-4 py-3">Ombor</th>
              <th className="px-4 py-3">Summa</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3">Sana</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => {
              const total = order.items.reduce(
                (s, i) => s + i.price * i.quantity,
                0
              );
              return (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {order.number}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {order.customer?.companyName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {order.warehouse?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {formatSum(total)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[order.status]}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(order.createdAt).toLocaleString("uz-UZ")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                    >
                      Ko&apos;rish
                    </Link>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Hozircha buyurtmalar yo&apos;q.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
