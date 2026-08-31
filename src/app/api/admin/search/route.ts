import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export type SearchResult = {
  type: "product" | "customer" | "supplier" | "order" | "request";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

const RESULTS_PER_TYPE = 5;

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return Response.json({ results: [] });
  }

  const [products, customers, suppliers, orders, requests] = await Promise.all([
    prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { barcode: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, sku: true },
      take: RESULTS_PER_TYPE,
    }),
    prisma.customer.findMany({
      where: {
        OR: [
          { companyName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, companyName: true, phone: true },
      take: RESULTS_PER_TYPE,
    }),
    prisma.supplier.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, phone: true },
      take: RESULTS_PER_TYPE,
    }),
    prisma.order.findMany({
      where: { number: { contains: q, mode: "insensitive" } },
      select: { id: true, number: true, status: true },
      take: RESULTS_PER_TYPE,
    }),
    prisma.rfqRequest.findMany({
      where: {
        OR: [
          { companyName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, companyName: true, phone: true },
      take: RESULTS_PER_TYPE,
    }),
  ]);

  const results: SearchResult[] = [
    ...products.map((p) => ({
      type: "product" as const,
      id: p.id,
      title: p.name,
      subtitle: p.sku ? `SKU: ${p.sku}` : "Mahsulot",
      href: `/admin/products/${p.id}/overview`,
    })),
    ...customers.map((c) => ({
      type: "customer" as const,
      id: c.id,
      title: c.companyName,
      subtitle: c.phone ?? "Mijoz",
      href: `/admin/customers/${c.id}`,
    })),
    ...suppliers.map((s) => ({
      type: "supplier" as const,
      id: s.id,
      title: s.name,
      subtitle: s.phone ?? "Yetkazib beruvchi",
      href: `/admin/suppliers/${s.id}`,
    })),
    ...orders.map((o) => ({
      type: "order" as const,
      id: o.id,
      title: o.number,
      subtitle: `Buyurtma · ${o.status}`,
      href: `/admin/orders/${o.id}`,
    })),
    ...requests.map((r) => ({
      type: "request" as const,
      id: r.id,
      title: r.companyName,
      subtitle: `Ariza · ${r.phone}`,
      href: `/admin/requests`,
    })),
  ];

  return Response.json({ results });
}
