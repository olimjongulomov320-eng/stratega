import Link from "next/link";
import { Fragment } from "react";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/require-permission";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";
import type { EmployeeRole } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const ROLES: EmployeeRole[] = ["OWNER", "ADMIN", "MANAGER", "WAREHOUSE", "ACCOUNTANT", "VIEWER"];

const ROLE_LABELS: Record<EmployeeRole, string> = {
  OWNER: "Egasi",
  ADMIN: "Administrator",
  MANAGER: "Menejer",
  WAREHOUSE: "Omborchi",
  ACCOUNTANT: "Buxgalter",
  VIEWER: "Kuzatuvchi",
};

const ROLE_DESCRIPTIONS: Record<EmployeeRole, string> = {
  OWNER: "Tizim egasi — barcha ruxsatlar, so'nggi instansiya.",
  ADMIN: "To'liq boshqaruv: mahsulot, ombor, moliya, foydalanuvchilar.",
  MANAGER: "Savdo: buyurtmalar, takliflar, mijozlar, ko'rish darajasidagi moliya.",
  WAREHOUSE: "Ombor ishlari: qabul, chiqim, hujjatlar, ko'rish darajasidagi buyurtmalar.",
  ACCOUNTANT: "Moliya: to'lovlar, narxlar, hisobotlar — ombor yozuvlarisiz.",
  VIEWER: "Faqat ko'rish: mahsulot, ombor, buyurtma, mijozlar.",
};

// Ustun kalitlari — PERMISSIONS ro'yxatidan guruhlab.
const PERMISSION_GROUPS: { title: string; keys: typeof PERMISSIONS[number][] }[] = [
  {
    title: "Mahsulotlar",
    keys: ["products.read", "products.write"],
  },
  {
    title: "Ombor",
    keys: ["stock.read", "stock.write"],
  },
  {
    title: "Savdo",
    keys: ["orders.read", "orders.write", "customers.read", "customers.write"],
  },
  {
    title: "Ta'minot",
    keys: ["suppliers.read", "suppliers.write"],
  },
  {
    title: "Moliya",
    keys: ["finance.read", "finance.write"],
  },
  {
    title: "Tizim",
    keys: ["users.manage", "settings.manage", "audit.read"],
  },
];

export default async function RolesPage() {
  await requirePagePermission("users.manage");

  const employees = await prisma.employee.groupBy({
    by: ["role"],
    _count: { role: true },
    where: { isActive: true },
  });
  const countByRole = new Map(employees.map((e) => [e.role, e._count.role]));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rollar va ruxsatlar</h1>
          <p className="mt-1 text-slate-500">
            Har bir rolining huquqlari. Tekshiruv har doim serverda bu jadval
            bo&apos;yicha bajariladi — UI faqat ko&apos;rsatish rolida.
          </p>
        </div>
        <Link
          href="/admin/employees"
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Xodimlarni boshqarish
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROLES.map((role) => (
          <div key={role} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">{ROLE_LABELS[role]}</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {countByRole.get(role) ?? 0} ta xodim
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{ROLE_DESCRIPTIONS[role]}</p>
            <p className="mt-2 text-xs font-medium text-slate-400">
              {PERMISSIONS.filter((p) => roleHasPermission(role, p)).length} /{" "}
              {PERMISSIONS.length} ruxsat
            </p>
          </div>
        ))}
      </div>

      {/* Ruxsatlar matritsasi */}
      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3">Ruxsat</th>
              {ROLES.map((role) => (
                <th key={role} className="px-3 py-3 text-center">
                  {ROLE_LABELS[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PERMISSION_GROUPS.map((group) => (
              <Fragment key={group.title}>
                <tr className="bg-slate-50/60">
                  <td
                    colSpan={ROLES.length + 1}
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {group.title}
                  </td>
                </tr>
                {group.keys.map((key) => (
                  <tr key={key} className="hover:bg-slate-50">
                    <td className="sticky left-0 bg-white px-4 py-2.5 font-mono text-xs text-slate-600">
                      {key}
                    </td>
                    {ROLES.map((role) => (
                      <td key={role} className="px-3 py-2.5 text-center">
                        {roleHasPermission(role, key) ? (
                          <span className="text-emerald-600" aria-label="bor">
                            ✓
                          </span>
                        ) : (
                          <span className="text-slate-300" aria-label="yo'q">
                            —
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Umumiy admin paroli bilan kirilganda OWNER darajasidagi to&apos;liq ruxsat
        beriladi. Xodim sessiyalarida faqat shu jadvaldagi ruxsatlar ishlaydi.
      </p>
    </div>
  );
}
