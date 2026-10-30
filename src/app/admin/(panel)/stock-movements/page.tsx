import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { PageHeader, Table, Td, Filters, inputCls, btn, LinkButton, DownloadLink } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { MOVE_REASON } from "@/lib/labels";
import type { Prisma, StockMoveReason } from "@/generated/prisma/client";

export default async function MovesPage(props: PageProps<"/admin/stock-movements">) {
  await requirePage("stock.read");
  const sp = await props.searchParams;
  const reason = typeof sp.reason === "string" ? sp.reason : "";
  const wh = typeof sp.warehouse === "string" ? sp.warehouse : "";
  const product = typeof sp.product === "string" ? sp.product : "";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const where: Prisma.StockMoveWhereInput = {
    ...(reason ? { reason: reason as StockMoveReason } : {}),
    ...(wh ? { warehouseId: wh } : {}),
    ...(product ? { productId: product } : {}),
    ...(q ? { OR: [{ product: { name: { contains: q, mode: "insensitive" } } }, { product: { sku: { contains: q, mode: "insensitive" } } }, { note: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [moves, count, warehouses] = await Promise.all([
    prisma.stockMove.findMany({ where, orderBy: { createdAt: "desc" }, take: 300, include: { product: true, warehouse: true, document: true } }),
    prisma.stockMove.count({ where }),
    prisma.warehouse.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div>
      <PageHeader
        title="Ombor harakatlari"
        description="Barcha qoldiq o'zgarishlarining o'zgartirib bo'lmaydigan jurnali."
        actions={
          <>
            <DownloadLink href="/api/admin/export?type=moves">CSV yuklab olish</DownloadLink>
            <LinkButton href="/admin/stock-documents/new">+ Yangi hujjat</LinkButton>
          </>
        }
      />
      <Filters>
        <input name="q" defaultValue={q} placeholder="Mahsulot, SKU yoki izoh" className={`${inputCls} max-w-xs`} />
        <select name="reason" defaultValue={reason} className={`${inputCls} max-w-xs`}>
          <option value="">Barcha sabablar</option>
          {Object.entries(MOVE_REASON).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="warehouse" defaultValue={wh} className={`${inputCls} max-w-xs`}>
          <option value="">Barcha omborlar</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        {product && <input type="hidden" name="product" value={product} />}
        <button className={btn("secondary")}>Filtrlash</button>
      </Filters>
      <p className="mb-2 text-sm text-slate-500">{count} ta yozuv{count > 300 ? " (oxirgi 300 tasi ko'rsatilgan)" : ""}</p>
      <Table head={["Sana", "Mahsulot", "Ombor", "O'zgarish", "Qoldiq", "Sabab", "Izoh / hujjat", "Kim"]}>
        {moves.map((m) => (
          <tr key={m.id}>
            <Td className="whitespace-nowrap text-xs">{formatDate(m.createdAt, true)}</Td>
            <Td><Link href={`/admin/products/${m.productId}/overview`} className="hover:text-indigo-600">{m.product.name}</Link><div className="text-xs text-slate-400">{m.product.sku}</div></Td>
            <Td>{m.warehouse.name}</Td>
            <Td right><span className={m.delta > 0 ? "text-emerald-600" : "text-red-600"}>{m.delta > 0 ? `+${m.delta}` : m.delta}</span></Td>
            <Td right>{m.balanceAfter}</Td>
            <Td>{MOVE_REASON[m.reason]}</Td>
            <Td>{m.document ? <Link href={`/admin/stock-documents/${m.document.id}`} className="text-indigo-600">{m.document.number}</Link> : m.note ?? "—"}</Td>
            <Td className="text-xs">{m.actor ?? "—"}</Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
