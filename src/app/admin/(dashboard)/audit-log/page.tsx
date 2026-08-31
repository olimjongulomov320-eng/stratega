import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  "product.create": "Mahsulot yaratildi",
  "product.update": "Mahsulot tahrirlandi",
  "supplier.create": "Yetkazib beruvchi yaratildi",
  "supplier.update": "Yetkazib beruvchi tahrirlandi",
  "supplier.delete": "Yetkazib beruvchi o'chirildi",
  "customer.create": "Mijoz yaratildi",
  "customer.update": "Mijoz tahrirlandi",
  "customer.delete": "Mijoz o'chirildi",
  "warehouse.create": "Ombor yaratildi",
  "warehouse.update": "Ombor tahrirlandi",
  "stock_document.create": "Ombor hujjati yaratildi",
  "stock_document.post": "Ombor hujjati проведено qilindi",
  "stock_document.cancel": "Ombor hujjati bekor qilindi",
  "order.create": "Buyurtma yaratildi",
  "order.status_change": "Buyurtma holati o'zgardi",
  "employee.create": "Xodim yaratildi",
  "employee.update": "Xodim tahrirlandi",
};

export default async function AuditLogPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true, email: true } } },
    take: 200,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Amallar tarixi</h1>
      <p className="mt-1 text-slate-500">
        Boshqaruv panelida bajarilgan muhim harakatlarning to&apos;liq
        tarixi.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Amal</th>
              <th className="px-4 py-3">Kim</th>
              <th className="px-4 py-3">Obyekt</th>
              <th className="px-4 py-3">Sana</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {ACTION_LABELS[log.action] ?? log.action}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {log.actor?.name ?? log.actorLabel ?? "Tizim"}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {log.entity} · {log.entityId.slice(0, 8)}...
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(log.createdAt).toLocaleString("uz-UZ")}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Hozircha yozuvlar yo&apos;q.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
