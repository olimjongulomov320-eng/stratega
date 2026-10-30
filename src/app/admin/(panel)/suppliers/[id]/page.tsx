import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Card, Table, Td, Field, inputCls, LinkButton } from "@/components/admin/ui";
import { ActionForm, ActionButton, Submit } from "@/components/admin/forms";
import { formatDate } from "@/lib/format";
import { DOC_TYPE } from "@/lib/labels";
import { SupplierForm } from "../supplier-form";
import { linkProduct, unlinkProduct } from "../actions";

export default async function SupplierPage(props: PageProps<"/admin/suppliers/[id]">) {
  const session = await requirePage("suppliers.read");
  const { id } = await props.params;
  const [supplier, products] = await Promise.all([
    prisma.supplier.findUnique({ where: { id }, include: { products: { include: { product: true } }, documents: { orderBy: { createdAt: "desc" }, take: 10 } } }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, sku: true } }),
  ]);
  if (!supplier) notFound();
  const canWrite = can(session.role, "suppliers.write");
  const canCost = can(session.role, "finance.read");
  return (
    <div>
      <PageHeader
        title={supplier.name}
        description={supplier.legalName ?? undefined}
        back={{ href: "/admin/suppliers", label: "Yetkazib beruvchilar" }}
        actions={can(session.role, "stock.write") && <LinkButton href="/admin/stock-documents/new?type=RECEIPT">+ Kirim hujjati</LinkButton>}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <div>{canWrite ? <SupplierForm values={supplier} /> : null}</div>
        <div className="flex flex-col gap-6">
          <Card title="Mahsulotlar">
            <Table head={["Mahsulot", "Yetk. SKU", "Narx (USD)", "Muddat", ""]} empty="Bog'langan mahsulot yo'q.">
              {supplier.products.map((ps) => (
                <tr key={ps.id}>
                  <Td><Link href={`/admin/products/${ps.productId}/overview`} className="hover:text-indigo-600">{ps.product.name}</Link></Td>
                  <Td>{ps.supplierSku ?? "—"}</Td>
                  <Td right>{canCost && ps.priceUsd ? `$${ps.priceUsd}` : "—"}</Td>
                  <Td>{ps.leadTimeDays ? `${ps.leadTimeDays} kun` : "—"}</Td>
                  <Td right>{canWrite && <ActionButton action={unlinkProduct} fields={{ id: ps.id }} variant="ghost">✕</ActionButton>}</Td>
                </tr>
              ))}
            </Table>
            {canWrite && (
              <ActionForm action={linkProduct} resetOnSuccess className="mt-4 grid gap-3 sm:grid-cols-4">
                <input type="hidden" name="supplierId" value={id} />
                <Field label="Mahsulot" className="sm:col-span-4">
                  <select name="productId" className={inputCls}>{products.map((p) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>)}</select>
                </Field>
                <Field label="Yetk. SKU"><input name="supplierSku" className={inputCls} /></Field>
                <Field label="Narx (USD, FOB)"><input name="priceUsd" inputMode="decimal" className={inputCls} /></Field>
                <Field label="Muddat (kun)"><input name="leadTimeDays" inputMode="numeric" className={inputCls} /></Field>
                <div className="self-end"><Submit size="sm">Bog&apos;lash</Submit></div>
              </ActionForm>
            )}
          </Card>
          <Card title="Kirim hujjatlari">
            <Table head={["Raqam", "Turi", "Sana"]} empty="Hujjatlar yo'q.">
              {supplier.documents.map((d) => (
                <tr key={d.id}>
                  <Td><Link href={`/admin/stock-documents/${d.id}`} className="text-indigo-600">{d.number}</Link></Td>
                  <Td>{DOC_TYPE[d.type]}</Td>
                  <Td className="text-xs">{formatDate(d.createdAt)}</Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
