import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Badge, Money, LinkButton } from "@/components/admin/ui";

export default async function WarehousesPage() {
  const session = await requirePage("stock.read");
  const warehouses = await prisma.warehouse.findMany({ orderBy: [{ isDefault: "desc" }, { name: "asc" }], include: { stockLevels: { include: { product: true } } } });
  const canCost = can(session.role, "finance.read");
  return (
    <div>
      <PageHeader title="Omborlar" description="Kompaniyaning barcha ombor manzillari." actions={can(session.role, "stock.write") && <LinkButton href="/admin/warehouses/new">+ Yangi ombor</LinkButton>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {warehouses.map((w) => {
          const units = w.stockLevels.reduce((s, l) => s + l.quantity, 0);
          const reserved = w.stockLevels.reduce((s, l) => s + l.reserved, 0);
          const products = w.stockLevels.filter((l) => l.quantity > 0).length;
          const value = w.stockLevels.reduce((s, l) => s + l.quantity * (l.product.costPrice ?? 0), 0);
          return (
            <Link key={w.id} href={`/admin/warehouses/${w.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-300">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">{w.name}</h2>
                <span className="flex gap-1">{w.isDefault && <Badge tone="indigo">Asosiy</Badge>}{w.isActive ? <Badge tone="green">Faol</Badge> : <Badge>Nofaol</Badge>}</span>
              </div>
              <p className="mt-1 font-mono text-xs text-slate-400">{w.code}{w.address ? ` · ${w.address}` : ""}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div><dt className="text-slate-500">Mahsulotlar</dt><dd className="font-semibold">{products}</dd></div>
                <div><dt className="text-slate-500">Birliklar</dt><dd className="font-semibold">{units}</dd></div>
                <div><dt className="text-slate-500">Band</dt><dd className="font-semibold">{reserved}</dd></div>
                {canCost && <div><dt className="text-slate-500">Qiymati (tannarx)</dt><dd className="font-semibold"><Money value={value} /></dd></div>}
              </dl>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
