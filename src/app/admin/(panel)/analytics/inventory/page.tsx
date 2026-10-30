import Link from "next/link";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Stat, Card, Table, Td, Money, DownloadLink } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { inventoryReport } from "@/lib/analytics";

export default async function InventoryAnalytics() {
  const session = await requirePage("stock.read");
  const r = await inventoryReport();
  const canCost = can(session.role, "finance.read");
  const reorder = r.rows.filter((x) => x.suggest > 0).sort((a, b) => (a.daysOfStock ?? 9999) - (b.daysOfStock ?? 9999));
  const dead = r.rows.filter((x) => x.dead).sort((a, b) => b.value - a.value);
  const over = r.rows.filter((x) => x.overstock);
  const out = r.rows.filter((x) => x.p.stock <= 0);
  const withDays = r.rows.filter((x) => x.daysOfStock !== null);
  const avgDays = withDays.length ? Math.round(withDays.reduce((a, x) => a + (x.daysOfStock ?? 0), 0) / withDays.length) : null;
  return (
    <div>
      <PageHeader
        title="Inventar tahlili"
        description={`Aylanma, o'lik ombor va qayta buyurtma — so'nggi ${r.lookback} kunlik harakatlardan.`}
        back={{ href: "/admin/analytics", label: "Savdo tahlili" }}
        actions={<DownloadLink href="/api/admin/export?type=inventory">CSV yuklab olish</DownloadLink>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {canCost && <Stat label="Ombor qiymati (tannarx)" value={<Money value={r.value} />} />}
        <Stat label="Yillik aylanma" value={`${r.turnover.toFixed(2)}×`} hint="tannarx bo'yicha" />
        <Stat label="Qoldiq necha kunga yetadi (o'rtacha)" value={avgDays !== null ? `${avgDays} kun` : "—"} />
        <Stat label="O'lik ombor (60+ kun sotilmagan)" value={dead.length} tone={dead.length ? "warn" : "good"} />
        <Stat label="Qayta buyurtma kerak" value={reorder.length} tone={reorder.length ? "warn" : "good"} />
        <Stat label="Tugagan" value={out.length} tone={out.length ? "bad" : "good"} />
        <Stat label="Ortiqcha ombor" value={over.length} />
      </div>
      <Card title="Qayta buyurtma tavsiyalari" className="mt-6">
        <Table head={["Mahsulot", "Tayyor", "Oylik sotuv", "Necha kunga", "Buyurtma nuqtasi", "Tavsiya"]} empty="Hozircha qayta buyurtma shart emas.">
          {reorder.map((x) => (
            <tr key={x.p.id}>
              <Td><Link href={`/admin/products/${x.p.id}/overview`} className="hover:text-indigo-600">{x.p.name}</Link></Td>
              <Td right>{x.available}</Td>
              <Td right>{x.perMonth.toFixed(1)}</Td>
              <Td right>{x.daysOfStock ?? "—"}</Td>
              <Td right>{x.reorderAt}</Td>
              <Td right><span className="font-semibold text-indigo-600">+{x.suggest}</span></Td>
            </tr>
          ))}
        </Table>
        <p className="mt-2 text-xs text-slate-400">Tavsiya = taxminan 3 oylik sotuv yoki mahsulotdagi «tavsiya buyurtma miqdori». Yetkazib berish muddati (Xitoy ~45 kun) ni hisobga oling.</p>
      </Card>
      <Card title="O'lik ombor" className="mt-6">
        <Table head={["Mahsulot", "Qoldiq", "Oxirgi jo'natma", ...(canCost ? ["Qiymati"] : [])]} empty="O'lik ombor yo'q.">
          {dead.map((x) => (
            <tr key={x.p.id}>
              <Td><Link href={`/admin/products/${x.p.id}/overview`} className="hover:text-indigo-600">{x.p.name}</Link></Td>
              <Td right>{x.p.stock}</Td>
              <Td>{x.last ? formatDate(x.last) : "hech qachon"}</Td>
              {canCost && <Td right><Money value={x.value} /></Td>}
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
