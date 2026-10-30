import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Card, Stat, Table, Td, Badge, Money, LinkButton, Field, inputCls } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/forms";
import { formatDate, formatNumber, daysAgo } from "@/lib/format";
import { MOVE_REASON, UNIT_LABEL } from "@/lib/labels";
import { adjustStock } from "../../actions";

export default async function ProductOverview(props: PageProps<"/admin/products/[id]/overview">) {
  const session = await requirePage("products.read");
  const { id } = await props.params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      stockLevels: { include: { warehouse: true } },
      suppliers: { include: { supplier: true } },
      priceChanges: { orderBy: { createdAt: "desc" }, take: 10 },
      stockMoves: { orderBy: { createdAt: "desc" }, take: 15, include: { warehouse: true } },
    },
  });
  if (!product) notFound();
  const warehouses = await prisma.warehouse.findMany({ where: { isActive: true }, orderBy: [{ isDefault: "desc" }, { name: "asc" }] });
  const since = daysAgo(90);
  const sold = await prisma.orderLine.aggregate({
    where: { productId: id, order: { status: { in: ["CONFIRMED", "SHIPPED", "COMPLETED"] }, confirmedAt: { gte: since } } },
    _sum: { quantity: true },
  });
  const reserved = product.stockLevels.reduce((s, l) => s + l.reserved, 0);
  const perDay = (sold._sum.quantity ?? 0) / 90;
  const daysLeft = perDay > 0 ? Math.round((product.stock - reserved) / perDay) : null;
  const canCost = can(session.role, "finance.read");
  const priceNet = product.price / 1.12;
  const margin = product.costPrice ? Math.round(((priceNet - product.costPrice) / priceNet) * 100) : null;

  return (
    <div>
      <PageHeader
        title={product.name}
        description={`${product.category.name} · ${UNIT_LABEL[product.unit]} · ${product.isActive ? "Faol" : "Yashirin"}`}
        back={{ href: "/admin/products", label: "Mahsulotlar" }}
        actions={
          <>
            {can(session.role, "products.write") && <LinkButton href={`/admin/products/${id}`}>Tahrirlash</LinkButton>}
            <a href={`/product/${product.slug}`} target="_blank" className="text-sm text-indigo-600">Saytda ↗</a>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Jami qoldiq" value={product.stock} />
        <Stat label="Band qilingan" value={reserved} />
        <Stat label="Sotuvga tayyor" value={product.stock - reserved} />
        <Stat label="Sotuv narxi" value={<Money value={product.price} />} />
        {canCost && <Stat label="Tannarx · marja (QQSsiz)" value={<Money value={product.costPrice} />} hint={margin !== null ? `${margin}%` : "tannarx kiritilmagan"} />}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {canCost && <Stat label="Ombor qiymati (tannarx)" value={<Money value={product.stock * (product.costPrice ?? 0)} />} />}
        <Stat label="Sotilgan (90 kun)" value={formatNumber(sold._sum.quantity ?? 0)} />
        <Stat label="Qoldiq tugash muddati" value={daysLeft !== null ? `${daysLeft} kun` : "—"} hint={daysLeft === null ? "sotuv tarixi yo'q" : undefined} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Omborlar bo'yicha">
          <Table head={["Ombor", "Mavjud", "Band", "Tayyor"]}>
            {product.stockLevels.map((l) => (
              <tr key={l.id}>
                <Td>{l.warehouse.name}</Td>
                <Td right>{l.quantity}</Td>
                <Td right>{l.reserved}</Td>
                <Td right>{l.quantity - l.reserved}</Td>
              </tr>
            ))}
          </Table>
          {can(session.role, "stock.write") && warehouses.length > 0 && (
            <ActionForm action={adjustStock} className="mt-4 grid gap-3 sm:grid-cols-4" resetOnSuccess>
              <input type="hidden" name="productId" value={product.id} />
              <Field label="Ombor">
                <select name="warehouseId" className={inputCls}>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </Field>
              <Field label="Amal">
                <select name="mode" className={inputCls}>
                  <option value="delta">+ / − qo&apos;shish</option>
                  <option value="set">Aniq qoldiq</option>
                </select>
              </Field>
              <Field label="Miqdor">
                <input name="value" required inputMode="numeric" className={inputCls} placeholder="masalan 5 yoki -2" />
              </Field>
              <Field label="Izoh">
                <input name="note" className={inputCls} />
              </Field>
              <div className="sm:col-span-4">
                <Submit size="sm">Qoldiqni tuzatish</Submit>
                <span className="ml-3 text-xs text-slate-400">Kirim/chiqim uchun ombor hujjatidan foydalaning — bu faqat tuzatish uchun.</span>
              </div>
            </ActionForm>
          )}
        </Card>

        <Card title="Yetkazib beruvchilar">
          <Table head={["Nomi", "SKU", "Narx (USD)", "Muddat"]} empty="Bog'langan yetkazib beruvchi yo'q.">
            {product.suppliers.map((s) => (
              <tr key={s.id}>
                <Td><Link href={`/admin/suppliers/${s.supplierId}`} className="text-indigo-600">{s.supplier.name}</Link></Td>
                <Td>{s.supplierSku ?? "—"}</Td>
                <Td right>{canCost && s.priceUsd ? `$${s.priceUsd}` : "—"}</Td>
                <Td>{s.leadTimeDays ? `${s.leadTimeDays} kun` : "—"}</Td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title="So'nggi ombor harakatlari" actions={<Link href={`/admin/stock-movements?product=${id}`} className="text-sm text-indigo-600">Barchasi →</Link>}>
          <Table head={["Sana", "Ombor", "O'zgarish", "Qoldiq", "Sabab"]}>
            {product.stockMoves.map((m) => (
              <tr key={m.id}>
                <Td className="whitespace-nowrap text-xs">{formatDate(m.createdAt, true)}</Td>
                <Td>{m.warehouse.name}</Td>
                <Td right><span className={m.delta > 0 ? "text-emerald-600" : "text-red-600"}>{m.delta > 0 ? `+${m.delta}` : m.delta}</span></Td>
                <Td right>{m.balanceAfter}</Td>
                <Td>{MOVE_REASON[m.reason]}{m.note ? <span className="block text-xs text-slate-400">{m.note}</span> : null}</Td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title="Narx o'zgarishlari">
          <Table head={["Sana", "Eski narx", "Yangi narx", "Kim"]} empty="O'zgarish yo'q.">
            {product.priceChanges.map((c) => (
              <tr key={c.id}>
                <Td className="text-xs">{formatDate(c.createdAt, true)}</Td>
                <Td right><Money value={c.oldPrice} /></Td>
                <Td right><Money value={c.newPrice} /></Td>
                <Td>{c.actor ?? "—"}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
      {!product.nameRu && (
        <p className="mt-4"><Badge tone="amber">Ruscha nom va tavsif kiritilmagan — /ru sahifada o&apos;zbekcha ko&apos;rinadi</Badge></p>
      )}
    </div>
  );
}
