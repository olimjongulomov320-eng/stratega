import Link from "next/link";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Stat, Card, Table, Td, Money, inputCls } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/forms";
import { supplierPurchases } from "@/lib/supplier-purchases";
import { formatDate } from "@/lib/format";
import { markPurchased } from "./actions";

export default async function SupplierPurchasesPage() {
  const session = await requirePage("orders.read");
  const showMoney = can(session.role, "finance.read");
  const canMark = can(session.role, "orders.write");
  const r = await supplierPurchases(30);
  const lineCount = r.toBuy.reduce((s, g) => s + g.lines.length, 0);
  return (
    <div>
      <PageHeader
        title="Ta'minotchidan xaridlar"
        description="Ta'minotchi omboridan sotiladigan mahsulotlar: sotilgach sotib olinadi va o'z omborimizga kirmaydi. Sotib olgach haqiqiy narxni yozing — marja shu narxdan hisoblanadi."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sotib olish kerak (qator)" value={lineCount} tone={lineCount ? "bad" : "good"} />
        {showMoney && <Stat label="Taxminiy summa" value={<Money value={r.toBuy.reduce((s, g) => s + g.estimated, 0)} />} />}
        {showMoney && <Stat label="30 kunda to'langan" value={<Money value={r.paid} />} />}
        {showMoney && <Stat label="30 kunlik marja (QQS bilan)" value={<Money value={r.margin} />} tone={r.margin >= 0 ? "good" : "bad"} />}
      </div>

      {r.toBuy.length === 0 && (
        <Card className="mt-6">
          <p className="text-sm text-slate-500">Sotib olinishi kerak bo&apos;lgan mahsulot yo&apos;q.</p>
        </Card>
      )}
      {r.toBuy.map((g) => (
        <Card key={g.supplier} title={`${g.supplier} — ${g.lines.length} qator`} className="mt-6">
          <Table head={["Buyurtma", "Mahsulot", "Soni", ...(showMoney ? ["Sotuv narxi", "Taxminiy tannarx"] : []), ...(canMark ? ["Sotib olindi (1 dona, so'm)"] : [])]}>
            {g.lines.map((l) => (
              <tr key={l.id}>
                <Td>
                  <Link href={`/admin/orders/${l.order.id}`} className="font-medium text-indigo-600 hover:underline">{l.order.number}</Link>
                  <div className="text-xs text-slate-400">{l.order.customer?.companyName ?? "—"} · {l.order.confirmedAt ? formatDate(l.order.confirmedAt) : ""}</div>
                </Td>
                <Td>{l.product.name}<div className="text-xs text-slate-400">{l.product.sku}</div></Td>
                <Td right>{l.quantity}</Td>
                {showMoney && <Td right><Money value={l.price} /></Td>}
                {showMoney && <Td right><Money value={l.costPrice} /></Td>}
                {canMark && (
                  <Td>
                    <ActionForm action={markPurchased} className="flex items-center gap-2">
                      <input type="hidden" name="lineId" value={l.id} />
                      <input name="purchaseCost" inputMode="numeric" required defaultValue={showMoney && l.costPrice ? l.costPrice : ""} placeholder="so'm" className={`${inputCls} w-32`} />
                      <Submit size="sm">Sotib olindi</Submit>
                    </ActionForm>
                  </Td>
                )}
              </tr>
            ))}
          </Table>
        </Card>
      ))}

      {r.bought.length > 0 && (
        <Card title="Oxirgi 30 kunda sotib olingan" className="mt-6">
          <Table head={["Sana", "Buyurtma", "Mahsulot", "Ta'minotchi", "Soni", ...(showMoney ? ["Sotuv", "Xarid", "Marja"] : [])]}>
            {r.bought.map((l) => (
              <tr key={l.id}>
                <Td>{l.purchasedAt ? formatDate(l.purchasedAt) : ""}</Td>
                <Td><Link href={`/admin/orders/${l.order.id}`} className="text-indigo-600 hover:underline">{l.order.number}</Link></Td>
                <Td>{l.product.name}</Td>
                <Td>{l.supplier?.name ?? "—"}</Td>
                <Td right>{l.quantity}</Td>
                {showMoney && <Td right><Money value={l.price * l.quantity} /></Td>}
                {showMoney && <Td right><Money value={(l.purchaseCost ?? 0) * l.quantity} /></Td>}
                {showMoney && <Td right><Money value={(l.price - (l.purchaseCost ?? 0)) * l.quantity} /></Td>}
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </div>
  );
}
