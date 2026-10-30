import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";
import { can, type Permission } from "@/lib/permissions";
import { salesReport, inventoryReport, supplierReport } from "@/lib/analytics";
import { MOVE_REASON, ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD, SHIPMENT_STATUS, QUOTE_STATUS } from "@/lib/labels";

export const runtime = "nodejs";

function csv(rows: (string | number | null | undefined)[][]): string {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? "" : String(v);
    // Prevent spreadsheet formula injection.
    const safe = /^[=+\-@\t\r]/.test(s) && !/^-?\d/.test(s) ? `'${s}` : s;
    return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return "﻿" + rows.map((r) => r.map(esc).join(",")).join("\n");
}

const PERM: Record<string, Permission> = {
  products: "products.read",
  stock: "stock.read",
  moves: "stock.read",
  inventory: "stock.read",
  orders: "orders.read",
  quotations: "orders.read",
  shipments: "orders.read",
  customers: "customers.read",
  payments: "finance.read",
  sales: "finance.read",
  suppliers: "finance.read",
};

export async function GET(req: Request) {
  const session = await getAdminSession();
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "";
  const perm = PERM[type];
  if (!perm) return new Response("Unknown type", { status: 400 });
  if (!session || !can(session.role, perm)) return new Response("Unauthorized", { status: 401 });
  const finance = can(session.role, "finance.read");
  let rows: (string | number | null | undefined)[][] = [];

  switch (type) {
    case "products": {
      const ps = await prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } });
      rows = [["slug", "nom", "nom_ru", "sku", "kategoriya", "narx", ...(finance ? ["tannarx"] : []), "qoldiq", "min_qoldiq", "faol"]];
      for (const p of ps) rows.push([p.slug, p.name, p.nameRu, p.sku, p.category.name, p.price, ...(finance ? [p.costPrice] : []), p.stock, p.minimumStock, p.isActive ? "ha" : "yo'q"]);
      break;
    }
    case "stock": {
      const wh = url.searchParams.get("warehouse");
      const levels = await prisma.stockLevel.findMany({ where: wh ? { warehouseId: wh } : {}, include: { product: true, warehouse: true } });
      rows = [["ombor", "mahsulot", "sku", "qoldiq", "band", "tayyor", ...(finance ? ["tannarx", "qiymati"] : [])]];
      for (const l of levels) rows.push([l.warehouse.name, l.product.name, l.product.sku, l.quantity, l.reserved, l.quantity - l.reserved, ...(finance ? [l.product.costPrice, l.product.costPrice ? l.product.costPrice * l.quantity : null] : [])]);
      break;
    }
    case "suppliers": {
      const days = Math.max(0, Number(url.searchParams.get("days")) || 0);
      const r = await supplierReport(days);
      rows = [["yetkazib_beruvchi", "mamlakat", "hujjatlar", "bekor", "dona", "xarid_summasi", "ortacha_tannarx", "katalogda", "muddat_kun", "oxirgi_kirim"]];
      for (const x of r.rows) rows.push([x.name, x.country, x.posted, x.cancelled, x.units, x.value, Math.round(x.avgUnitCost), x.catalogProducts, x.avgLeadDays, x.last ? x.last.toISOString().slice(0, 10) : ""]);
      break;
    }
    case "moves": {
      const ms = await prisma.stockMove.findMany({ orderBy: { createdAt: "desc" }, take: 20000, include: { product: true, warehouse: true } });
      rows = [["sana", "mahsulot", "sku", "ombor", "ozgarish", "qoldiq", "sabab", "izoh", "kim"]];
      for (const m of ms) rows.push([m.createdAt.toISOString(), m.product.name, m.product.sku, m.warehouse.name, m.delta, m.balanceAfter, MOVE_REASON[m.reason], m.note, m.actor]);
      break;
    }
    case "inventory": {
      const r = await inventoryReport();
      rows = [["mahsulot", "sku", "qoldiq", "band", "tayyor", "oylik_sotuv", "necha_kunga", "tavsiya", ...(finance ? ["qiymati"] : [])]];
      for (const x of r.rows) rows.push([x.p.name, x.p.sku, x.p.stock, x.reserved, x.available, x.perMonth.toFixed(1), x.daysOfStock, x.suggest, ...(finance ? [x.value] : [])]);
      break;
    }
    case "orders": {
      const os = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, include: { customer: true, warehouse: true } });
      rows = [["raqam", "sana", "mijoz", "ombor", "summa", "tolangan", "holat", "tolov_holati"]];
      for (const o of os) rows.push([o.number, o.createdAt.toISOString().slice(0, 10), o.customer?.companyName, o.warehouse.name, o.total, o.paidAmount, ORDER_STATUS[o.status].label, PAYMENT_STATUS[o.paymentStatus].label]);
      break;
    }
    case "quotations": {
      const qs = await prisma.quotation.findMany({ orderBy: { createdAt: "desc" }, include: { customer: true } });
      rows = [["raqam", "sana", "mijoz", "summa", "holat", "amal_qiladi"]];
      for (const q of qs) rows.push([q.number, q.createdAt.toISOString().slice(0, 10), q.customer?.companyName, q.total, QUOTE_STATUS[q.status].label, q.validUntil?.toISOString().slice(0, 10)]);
      break;
    }
    case "shipments": {
      const ss = await prisma.shipment.findMany({ orderBy: { createdAt: "desc" }, include: { order: true, warehouse: true } });
      rows = [["raqam", "buyurtma", "ombor", "holat", "masul", "yaratilgan", "jonatilgan"]];
      for (const s of ss) rows.push([s.number, s.order.number, s.warehouse.name, SHIPMENT_STATUS[s.status].label, s.assignee, s.createdAt.toISOString().slice(0, 10), s.shippedAt?.toISOString().slice(0, 10)]);
      break;
    }
    case "customers": {
      const cs = await prisma.customer.findMany({ orderBy: { companyName: "asc" } });
      rows = [["kompaniya", "aloqa", "telefon", "email", "inn", "manzil", "kredit_limiti"]];
      for (const c of cs) rows.push([c.companyName, c.contactName, c.phone, c.email, c.inn, c.address, c.creditLimit]);
      break;
    }
    case "payments": {
      const ps = await prisma.payment.findMany({ orderBy: { paidAt: "desc" }, include: { order: { include: { customer: true } } } });
      rows = [["sana", "buyurtma", "mijoz", "summa", "usul", "holat", "hujjat"]];
      for (const p of ps) rows.push([p.paidAt.toISOString().slice(0, 10), p.order.number, p.order.customer?.companyName, p.status === "REFUNDED" ? -p.amount : p.amount, PAYMENT_METHOD[p.method], p.status, p.reference]);
      break;
    }
    case "sales": {
      const days = Number(url.searchParams.get("days")) || 30;
      const r = await salesReport(days);
      rows = [["mahsulot", "soni", "tushum", "tannarx", "marja_%"]];
      for (const p of r.topProducts) rows.push([p.name, p.qty, p.revenue, p.cost, p.margin.toFixed(1)]);
      break;
    }
  }
  return new Response(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stratega-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
