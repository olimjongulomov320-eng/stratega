import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { PageHeader, Table, Td, Filters, inputCls, btn } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

export default async function AuditPage(props: PageProps<"/admin/audit-log">) {
  await requirePage("audit.read");
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const rows = await prisma.auditLog.findMany({
    where: q ? { OR: [{ action: { contains: q, mode: "insensitive" } }, { actor: { contains: q, mode: "insensitive" } }, { entityType: { contains: q, mode: "insensitive" } }] } : {},
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return (
    <div>
      <PageHeader title="Amallar tarixi" description="Boshqaruv panelidagi muhim harakatlar (oxirgi 500 ta)." />
      <Filters>
        <input name="q" defaultValue={q} placeholder="Amal, xodim yoki obyekt" className={`${inputCls} max-w-xs`} />
        <button className={btn("secondary")}>Qidirish</button>
      </Filters>
      <Table head={["Sana", "Amal", "Kim", "Obyekt", "Tafsilot"]}>
        {rows.map((r) => (
          <tr key={r.id}>
            <Td className="whitespace-nowrap text-xs">{formatDate(r.createdAt, true)}</Td>
            <Td>{r.action}</Td>
            <Td>{r.actor}</Td>
            <Td className="text-xs">{r.entityType ?? "—"}{r.entityId ? ` · ${r.entityId.slice(-8)}` : ""}</Td>
            <Td className="max-w-xs truncate font-mono text-xs text-slate-500">{r.details ? JSON.stringify(r.details) : ""}</Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
