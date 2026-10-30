import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { PERMISSIONS, PERMISSION_LABELS, ROLE_LABELS, ROLE_PERMISSIONS } from "@/lib/permissions";
import { PageHeader } from "@/components/admin/ui";
import type { AdminRole } from "@/lib/admin-auth";

export default async function RolesPage() {
  await requirePage("users.manage");
  const counts = await prisma.employee.groupBy({ by: ["role"], where: { isActive: true }, _count: true });
  const countBy = new Map(counts.map((c) => [c.role, c._count]));
  const roles = Object.keys(ROLE_LABELS) as AdminRole[];
  return (
    <div>
      <PageHeader title="Rollar va ruxsatlar" description="Har bir rolning huquqlari. Tekshiruv har doim serverda shu jadval bo'yicha bajariladi." />
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {roles.map((r) => (
          <div key={r} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-800">{ROLE_LABELS[r].name}</p>
            <p className="text-xs text-slate-400">{countBy.get(r) ?? 0} ta xodim · {ROLE_PERMISSIONS[r].length}/{PERMISSIONS.length} ruxsat</p>
            <p className="mt-2 text-sm text-slate-600">{ROLE_LABELS[r].description}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-3 text-left">Ruxsat</th>{roles.map((r) => <th key={r} className="px-2 py-3">{ROLE_LABELS[r].name}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PERMISSIONS.map((p) => (
              <tr key={p}>
                <td className="px-4 py-2">{PERMISSION_LABELS[p]} <span className="font-mono text-xs text-slate-400">{p}</span></td>
                {roles.map((r) => <td key={r} className="px-2 py-2 text-center">{ROLE_PERMISSIONS[r].includes(p) ? <span className="text-emerald-600">✓</span> : <span className="text-slate-300">—</span>}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
