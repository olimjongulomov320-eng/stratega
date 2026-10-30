import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Table, Td, Badge, Money, LinkButton, Filters, inputCls, btn, DownloadLink } from "@/components/admin/ui";
import type { Prisma } from "@/generated/prisma/client";

export default async function ProductsPage(props: PageProps<"/admin/products">) {
  const session = await requirePage("products.read");
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const cat = typeof sp.category === "string" ? sp.category : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const page = Math.max(1, Math.floor(Number(sp.page) || 1));
  const pageSize = 50;
  const conditions: Prisma.ProductWhereInput[] = [];
  if (q) conditions.push({ OR: [{ name: { contains: q, mode: "insensitive" } }, { nameRu: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }, { slug: { contains: q } }] });
  if (cat) conditions.push({ categoryId: cat });
  if (status === "active") conditions.push({ isActive: true });
  if (status === "hidden") conditions.push({ isActive: false });
  if (status === "noru") conditions.push({ OR: [{ nameRu: null }, { descriptionRu: null }] });
  if (status === "noimage") conditions.push({ imageUrl: null });
  if (status === "onrequest") conditions.push({ priceOnRequest: true });
  const where: Prisma.ProductWhereInput = conditions.length ? { AND: conditions } : {};
  const [products, categories, total, allTotal] = await Promise.all([
    prisma.product.findMany({ where, include: { category: true }, orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }], take: pageSize, skip: (page - 1) * pageSize }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.count({ where }),
    prisma.product.count(),
  ]);
  const canWrite = can(session.role, "products.write");
  const canCost = can(session.role, "finance.read");

  return (
    <div>
      <PageHeader
        title="Mahsulotlar"
        description={`${total} ta natija · jami ${allTotal} ta mahsulot`}
        actions={
          <>
            <DownloadLink href="/api/admin/export?type=products">CSV eksport</DownloadLink>
            {canWrite && <LinkButton href="/admin/products/import" variant="secondary">CSV import</LinkButton>}
            {canWrite && <LinkButton href="/admin/products/images" variant="secondary">Rasmlarni yuklash</LinkButton>}
            <LinkButton href="/admin/products/olx" variant="secondary">OLX eksport</LinkButton>
            {canWrite && <LinkButton href="/admin/products/new">+ Yangi mahsulot</LinkButton>}
          </>
        }
      />
      <Filters>
        <input name="q" defaultValue={q} placeholder="Nomi, SKU yoki slug" className={`${inputCls} max-w-xs`} />
        <select name="category" defaultValue={cat} className={`${inputCls} max-w-xs`}>
          <option value="">Barcha kategoriyalar</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="status" defaultValue={status} className={`${inputCls} max-w-[14rem]`}>
          <option value="">Barchasi</option>
          <option value="active">Faol</option>
          <option value="hidden">Yashirilgan</option>
          <option value="noru">Ruscha tarjima yo&apos;q</option>
          <option value="noimage">Rasmsiz</option>
          <option value="onrequest">Narxi so&apos;rov bo&apos;yicha</option>
        </select>
        <button className={btn("secondary")}>Qidirish</button>
      </Filters>
      <Table head={["Mahsulot", "Kategoriya", "Narx", ...(canCost ? ["Tannarx / marja"] : []), "Qoldiq", "Holat", ""]} empty="Mahsulot topilmadi.">
        {products.map((p) => {
          const margin = p.price > 0 && !p.priceOnRequest && p.costPrice !== null ? Math.round(((p.price / 1.12 - p.costPrice) / (p.price / 1.12)) * 100) : null;
          return (
            <tr key={p.id} className="hover:bg-slate-50">
              <Td>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <span>📦</span>
                    )}
                  </div>
                  <div>
                    <Link href={`/admin/products/${p.id}/overview`} className="font-medium text-slate-800 hover:text-indigo-600">{p.name}</Link>
                    <div className="text-xs text-slate-400">
                      {p.sku ?? "—"}
                      {!p.nameRu && <span className="ml-2 text-amber-600">RU yo&apos;q</span>}
                    </div>
                  </div>
                </div>
              </Td>
              <Td>{p.category.name}</Td>
              <Td right>{p.priceOnRequest ? <Badge tone="amber">So&apos;rov bo&apos;yicha</Badge> : <Money value={p.price} />}</Td>
              {canCost && (
                <Td right>
                  <Money value={p.costPrice} />
                  {margin !== null && <div className={`text-xs ${margin < 10 ? "text-red-600" : "text-slate-400"}`}>{margin}% (QQSsiz)</div>}
                </Td>
              )}
              <Td right>
                <span className={p.stock <= 0 ? "text-red-600" : p.stock <= p.minimumStock ? "text-amber-600" : ""}>{p.stock}</span>
              </Td>
              <Td>{p.isActive ? <Badge tone="green">Faol</Badge> : <Badge>Yashirin</Badge>}</Td>
              <Td right>
                <div className="flex justify-end gap-2 text-xs">
                  <Link href={`/admin/products/${p.id}/overview`} className="text-indigo-600">Ko&apos;rish</Link>
                  {canWrite && <Link href={`/admin/products/${p.id}`} className="text-indigo-600">Tahrirlash</Link>}
                </div>
              </Td>
            </tr>
          );
        })}
      </Table>
      {total > pageSize && <nav aria-label="Sahifalar" className="mt-5 flex items-center justify-center gap-3 text-sm">
        {page > 1 && <Link className="rounded-lg border px-3 py-2" href={`/admin/products?${new URLSearchParams({ ...(q ? { q } : {}), ...(cat ? { category: cat } : {}), ...(status ? { status } : {}), page: String(page - 1) })}`}>← Oldingi</Link>}
        <span className="text-slate-500">{page} / {Math.ceil(total / pageSize)}</span>
        {page < Math.ceil(total / pageSize) && <Link className="rounded-lg border px-3 py-2" href={`/admin/products?${new URLSearchParams({ ...(q ? { q } : {}), ...(cat ? { category: cat } : {}), ...(status ? { status } : {}), page: String(page + 1) })}`}>Keyingi →</Link>}
      </nav>}
      <p className="mt-2 text-xs text-slate-400">Marja = (narx QQSsiz − tannarx) / narx QQSsiz.</p>
    </div>
  );
}
