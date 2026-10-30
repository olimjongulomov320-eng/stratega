import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Card, Money, inputCls } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/forms";
import { PriceListForm } from "../list-form";
import { savePrices } from "../actions";

export default async function PriceListPage(props: PageProps<"/admin/price-lists/[id]">) {
  const session = await requirePage("finance.read");
  const { id } = await props.params;
  const [list, products] = await Promise.all([
    prisma.priceList.findUnique({ where: { id }, include: { items: true, customers: { select: { companyName: true } } } }),
    prisma.product.findMany({ orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }], select: { id: true, name: true, sku: true, price: true, costPrice: true } }),
  ]);
  if (!list) notFound();
  const prices = new Map(list.items.map((i) => [i.productId, i.price]));
  const canWrite = can(session.role, "finance.write");
  return (
    <div>
      <PageHeader title={list.name} description={list.customers.length ? `Mijozlar: ${list.customers.map((c) => c.companyName).join(", ")}` : "Mijozlar biriktirilmagan"} back={{ href: "/admin/price-lists", label: "Narxlar ro'yxatlari" }} />
      {canWrite && <div className="mb-6"><PriceListForm values={list} /></div>}
      <Card title="Narxlar (bo'sh — sayt narxi)">
        <ActionForm action={savePrices}>
          <input type="hidden" name="priceListId" value={id} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-2">Mahsulot</th><th className="py-2 text-right">Sayt narxi</th><th className="py-2 text-right">Tannarx</th><th className="w-48 py-2">Ro&apos;yxat narxi</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2">{p.name}<span className="ml-2 text-xs text-slate-400">{p.sku}</span></td>
                    <td className="py-2 text-right"><Money value={p.price} /></td>
                    <td className="py-2 text-right"><Money value={p.costPrice} /></td>
                    <td className="py-2"><input name={`p_${p.id}`} inputMode="numeric" defaultValue={prices.get(p.id) ?? ""} disabled={!canWrite} className={inputCls} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {canWrite && <div className="mt-4"><Submit>Narxlarni saqlash</Submit></div>}
        </ActionForm>
      </Card>
    </div>
  );
}
