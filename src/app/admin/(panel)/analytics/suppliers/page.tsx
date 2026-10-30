import Link from "next/link";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Stat, Card, Table, Td, Money, Badge, btn, DownloadLink } from "@/components/admin/ui";
import { formatDate, formatNumber } from "@/lib/format";
import { supplierReport } from "@/lib/analytics";

const PERIODS = [
  { days: 30, label: "30 kun" },
  { days: 90, label: "90 kun" },
  { days: 365, label: "1 yil" },
  { days: 0, label: "Hammasi" },
];

export default async function SupplierAnalyticsPage(props: PageProps<"/admin/analytics/suppliers">) {
  const session = await requirePage("suppliers.read");
  const sp = await props.searchParams;
  const days = PERIODS.some((p) => p.days === Number(sp.days)) && sp.days !== undefined ? Number(sp.days) : 90;
  const r = await supplierReport(days);
  const canCost = can(session.role, "finance.read");
  const max = Math.max(1, ...r.rows.map((x) => x.value));
  const top = r.rows.filter((x) => x.value > 0).slice(0, 8);
  return (
    <div>
      <PageHeader
        title="Yetkazib beruvchilar tahlili"
        description="O'tkazilgan kirim hujjatlaridan: kimdan qancha xarid qilindi, o'rtacha tannarx va yetkazib berish muddati."
        back={{ href: "/admin/suppliers", label: "Yetkazib beruvchilar" }}
        actions={
          <>
            {PERIODS.map((p) => (
              <Link key={p.days} href={`/admin/analytics/suppliers?days=${p.days}`} className={btn(p.days === days ? "primary" : "secondary", "sm")}>{p.label}</Link>
            ))}
            {canCost && <DownloadLink href={`/api/admin/export?type=suppliers&days=${days}`} size="sm">CSV</DownloadLink>}
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {canCost && <Stat label="Jami xarid (tannarx)" value={<Money value={r.total} />} />}
        <Stat label="Kirim hujjatlari" value={formatNumber(r.documents)} />
        <Stat label="Yetkazib beruvchilar" value={r.rows.length} />
        {canCost && <Stat label="Eng katta ulush" value={top[0] ? `${Math.round((top[0].value / Math.max(1, r.total)) * 100)}%` : "—"} hint={top[0]?.name} />}
      </div>
      {canCost && top.length > 0 && (
        <Card title="Xarid hajmi bo'yicha" className="mt-6">
          <div className="flex flex-col gap-2">
            {top.map((x) => (
              <div key={x.id} className="grid grid-cols-[minmax(0,12rem)_1fr_auto] items-center gap-3 text-sm">
                <Link href={`/admin/suppliers/${x.id}`} className="truncate text-slate-700 hover:text-indigo-600">{x.name}</Link>
                <div className="h-3 rounded-full bg-slate-100">
                  <div className="h-3 rounded-full bg-indigo-500" style={{ width: `${Math.max(2, (x.value / max) * 100)}%` }} />
                </div>
                <span className="tabular-nums text-slate-600"><Money value={x.value} /></span>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card title="Barcha yetkazib beruvchilar" className="mt-6">
        <Table
          head={["Yetkazib beruvchi", "Hujjatlar", "Bekor", "Dona", ...(canCost ? ["Xarid summasi", "O'rtacha tannarx"] : []), "Katalogda", "Muddat (kun)", "Bajarilish", "Oxirgi kirim"]}
          empty="Bu davrda kirim hujjatlari yo'q."
        >
          {r.rows.map((x) => (
            <tr key={x.id}>
              <Td>
                <Link href={`/admin/suppliers/${x.id}`} className="font-medium hover:text-indigo-600">{x.name}</Link>
                {!x.isActive && <span className="ml-2"><Badge>Nofaol</Badge></span>}
                {x.country && <div className="text-xs text-slate-400">{x.country}</div>}
              </Td>
              <Td right>{x.posted}</Td>
              <Td right>{x.cancelled || "—"}</Td>
              <Td right>{formatNumber(x.units)}</Td>
              {canCost && <Td right><Money value={x.value} />{x.missingCost > 0 && <div className="text-xs text-amber-600">{x.missingCost} qatorda tannarx yo&apos;q</div>}</Td>}
              {canCost && <Td right>{x.units ? <Money value={Math.round(x.avgUnitCost)} /> : "—"}</Td>}
              <Td right>{x.catalogProducts}</Td>
              <Td right>{x.avgLeadDays ?? "—"}</Td>
              <Td right>{x.completion === null ? "—" : `${Math.round(x.completion)}%`}</Td>
              <Td>{x.last ? formatDate(x.last) : "—"}</Td>
            </tr>
          ))}
        </Table>
        <p className="mt-2 text-xs text-slate-400">Muddat — mahsulot kartochkasidagi yetkazib beruvchi ma&apos;lumotidan (o&apos;rtacha). Bajarilish — o&apos;tkazilgan / (o&apos;tkazilgan + bekor qilingan) kirimlar.</p>
      </Card>
    </div>
  );
}
