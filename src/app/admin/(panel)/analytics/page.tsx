import Link from "next/link";
import { requirePage } from "@/lib/admin";
import { PageHeader, Stat, Card, Table, Td, Money, btn, DownloadLink } from "@/components/admin/ui";
import { formatNumber } from "@/lib/format";
import { salesReport } from "@/lib/analytics";

const PERIODS = [7, 30, 90, 365];

export default async function AnalyticsPage(props: PageProps<"/admin/analytics">) {
  await requirePage("finance.read");
  const sp = await props.searchParams;
  const days = PERIODS.includes(Number(sp.days)) ? Number(sp.days) : 30;
  const r = await salesReport(days);
  const max = Math.max(1, ...r.byDay.map(([, v]) => v));
  return (
    <div>
      <PageHeader
        title="Savdo tahlili"
        description="Tasdiqlangan buyurtmalardan hisoblangan tushum, tannarx va foyda."
        actions={
          <>
            {PERIODS.map((d) => (
              <Link key={d} href={`/admin/analytics?days=${d}`} className={btn(d === days ? "primary" : "secondary", "sm")}>{d === 365 ? "1 yil" : `${d} kun`}</Link>
            ))}
            <DownloadLink href={`/api/admin/export?type=sales&days=${days}`} size="sm">CSV</DownloadLink>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={`Tushum (QQS bilan) · ${r.orders} ta buyurtma`} value={<Money value={r.revenue} />} />
        <Stat label="Tannarx (COGS)" value={<Money value={r.cogs} />} hint={r.missingCost ? `${r.missingCost} qatorda tannarx yo'q` : undefined} />
        <Stat label="Sof foyda (QQSsiz)" value={<Money value={Math.round(r.profit)} />} tone={r.profit >= 0 ? "good" : "bad"} />
        <Stat label="Marja" value={`${r.revenueNet ? ((r.profit / r.revenueNet) * 100).toFixed(1) : "0.0"}%`} hint={`O'rtacha chek: ${formatNumber(r.orders ? r.revenue / r.orders : 0)}`} />
      </div>

      {r.byDay.length > 0 && (
        <Card title="Kunlik tushum" className="mt-6">
          <div className="flex h-40 items-end gap-1" role="img" aria-label="Kunlik tushum grafigi">
            {r.byDay.map(([day, v]) => (
              <div key={day} className="group relative flex-1" title={`${day}: ${formatNumber(v)} so'm`}>
                <div className="w-full rounded-t bg-indigo-500" style={{ height: `${Math.max(2, (v / max) * 150)}px` }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-xs text-slate-400"><span>{r.byDay[0][0]}</span><span>{r.byDay[r.byDay.length - 1][0]}</span></div>
        </Card>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Eng ko'p sotilgan mahsulotlar">
          <Table head={["Mahsulot", "Soni", "Tushum"]} empty="Savdo yo'q.">
            {r.topProducts.map((p) => <tr key={p.id}><Td><Link href={`/admin/products/${p.id}/overview`} className="hover:text-indigo-600">{p.name}</Link></Td><Td right>{p.qty}</Td><Td right><Money value={p.revenue} /></Td></tr>)}
          </Table>
        </Card>
        <Card title="Eng foydali mahsulotlar (marja)">
          <Table head={["Mahsulot", "Marja"]} empty="Tannarxli savdo yo'q.">
            {r.topMargin.map((p) => <tr key={p.id}><Td>{p.name}</Td><Td right>{p.margin.toFixed(1)}%</Td></tr>)}
          </Table>
        </Card>
        <Card title="Eng qimmatli mijozlar">
          <Table head={["Mijoz", "Buyurtma", "Tushum"]} empty="Ma'lumot yo'q.">
            {r.topCustomers.map((c) => <tr key={c.name}><Td>{c.name}</Td><Td right>{c.orders}</Td><Td right><Money value={c.revenue} /></Td></tr>)}
          </Table>
        </Card>
      </div>
      <p className="mt-4 text-sm"><Link href="/admin/analytics/inventory" className="text-indigo-600">Inventar tahlili →</Link> · <Link href="/admin/payments" className="text-indigo-600">To&apos;lovlar va qarzdorlik →</Link></p>
    </div>
  );
}
