import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/require-permission";
import { toCsv } from "@/lib/csv";
import type { Permission } from "@/lib/permissions";

export const runtime = "nodejs";

const MAX_ROWS = 50_000;

// Server tomonidagi CSV eksporti. Har bir tur uchun minimal ruxsat
// talab qilinadi (client emas, server qaror qiladi).
const EXPORTS: Record<
  string,
  {
    permission: Permission;
    build: () => Promise<{ headers: string[]; rows: (string | number | null)[][] }>;
  }
> = {
  products: {
    permission: "products.read",
    build: async () => {
      const products = await prisma.product.findMany({
        include: { category: { select: { name: true } } },
        take: MAX_ROWS,
      });
      return {
        headers: [
          "slug", "nom", "sku", "shtrix_kod", "olchov", "kategoriya",
          "narx", "tannarx", "qoldiq", "min_qoldiq", "faol",
        ],
        rows: products.map((p) => [
          p.slug, p.name, p.sku, p.barcode, p.unit, p.category.name,
          p.price, p.costPrice, p.stock, p.minimumStock, p.isActive ? "ha" : "yo'q",
        ]),
      };
    },
  },
  inventory: {
    permission: "stock.read",
    build: async () => {
      const stocks = await prisma.stock.findMany({
        include: {
          product: { select: { name: true, sku: true, price: true, costPrice: true, unit: true } },
          warehouse: { select: { name: true, code: true } },
        },
        take: MAX_ROWS,
      });
      return {
        headers: ["mahsulot", "sku", "olchov", "ombor", "kod", "qoldiq", "band", "mavjud", "sotuv_narxi", "ombor_qiymati"],
        rows: stocks.map((s) => [
          s.product.name, s.product.sku, s.product.unit, s.warehouse.name, s.warehouse.code,
          s.quantity, s.reserved, s.quantity - s.reserved, s.product.price,
          s.quantity * (s.product.costPrice ?? s.product.price),
        ]),
      };
    },
  },
  orders: {
    permission: "orders.read",
    build: async () => {
      const orders = await prisma.order.findMany({
        include: {
          customer: { select: { companyName: true } },
          items: { select: { price: true, quantity: true } },
          payments: { select: { amount: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
        take: MAX_ROWS,
      });
      return {
        headers: ["raqam", "mijoz", "holat", "summa", "to'langan", "sana"],
        rows: orders.map((o) => {
          const total = o.items.reduce((s, i) => s + i.price * i.quantity, 0);
          const paid = o.payments
            .filter((p) => p.status !== "REFUNDED")
            .reduce((s, p) => s + p.amount, 0);
          return [o.number, o.customer?.companyName ?? "", o.status, total, paid, o.createdAt.toISOString()];
        }),
      };
    },
  },
  customers: {
    permission: "customers.read",
    build: async () => {
      const customers = await prisma.customer.findMany({
        include: { _count: { select: { orders: true } } },
        take: MAX_ROWS,
      });
      return {
        headers: ["kompaniya", "aloqa", "telefon", "email", "inn", "kredit_limiti", "buyurtmalar", "faol"],
        rows: customers.map((c) => [
          c.companyName, c.contactName, c.phone, c.email, c.taxId,
          c.creditLimit, c._count.orders, c.isActive ? "ha" : "yo'q",
        ]),
      };
    },
  },
  suppliers: {
    permission: "suppliers.read",
    build: async () => {
      const suppliers = await prisma.supplier.findMany({
        include: { _count: { select: { products: true, documents: true } } },
        take: MAX_ROWS,
      });
      return {
        headers: ["nomi", "yuridik_nomi", "telefon", "email", "manzil", "inn", "mahsulotlar", "hujjatlar", "faol"],
        rows: suppliers.map((s) => [
          s.name, s.legalName, s.phone, s.email, s.address, s.taxId,
          s._count.products, s._count.documents, s.isActive ? "ha" : "yo'q",
        ]),
      };
    },
  },
  movements: {
    permission: "stock.read",
    build: async () => {
      const moves = await prisma.stockMove.findMany({
        include: {
          product: { select: { name: true, sku: true } },
          warehouse: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: MAX_ROWS,
      });
      return {
        headers: ["sana", "mahsulot", "sku", "ombor", "o'zgarish", "qoldiq", "sabab", "bog'lanish", "izoh"],
        rows: moves.map((m) => [
          m.createdAt.toISOString(), m.product.name, m.product.sku, m.warehouse?.name ?? "",
          m.change, m.stockAfter, m.reason,
          m.referenceType ? `${m.referenceType}:${m.referenceId ?? ""}` : "", m.note,
        ]),
      };
    },
  },
  payments: {
    permission: "finance.read",
    build: async () => {
      const payments = await prisma.payment.findMany({
        include: {
          order: { select: { number: true } },
          customer: { select: { companyName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: MAX_ROWS,
      });
      return {
        headers: ["sana", "buyurtma", "mijoz", "summa", "holat", "usul", "izoh"],
        rows: payments.map((p) => [
          (p.receivedAt ?? p.createdAt).toISOString(), p.order.number,
          p.customer?.companyName ?? "", p.amount, p.status, p.method, p.note,
        ]),
      };
    },
  },
  documents: {
    permission: "stock.read",
    build: async () => {
      const docs = await prisma.stockDocument.findMany({
        include: {
          warehouse: { select: { name: true } },
          destWarehouse: { select: { name: true } },
          supplier: { select: { name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        take: MAX_ROWS,
      });
      return {
        headers: ["raqam", "turi", "holat", "ombor", "manzil_ombor", "yetkazib_beruvchi", "qatorlar", "sana"],
        rows: docs.map((d) => [
          d.number, d.type, d.status, d.warehouse.name,
          d.destWarehouse?.name ?? "", d.supplier?.name ?? "", d._count.items,
          d.createdAt.toISOString(),
        ]),
      };
    },
  },
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "";
  const exporter = EXPORTS[type];

  if (!exporter) {
    return Response.json(
      { error: "Noto'g'ri eksport turi.", available: Object.keys(EXPORTS) },
      { status: 400 }
    );
  }

  try {
    await requireAdminPermission(exporter.permission);
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { headers, rows } = await exporter.build();
  const csv = toCsv(headers, rows);
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stratega-${type}-${stamp}.csv"`,
    },
  });
}
