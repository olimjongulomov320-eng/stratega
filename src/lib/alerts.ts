import "server-only";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import type { AlertSeverity } from "@/generated/prisma/client";

type Found = { key: string; type: string; severity: AlertSeverity; message: string; entityType?: string; entityId?: string };

/** Recompute alerts from real data. Keeps read state; resolves alerts that no longer apply. */
export async function recalcAlerts() {
  const s = await getSettings();
  const low = Number(s["stock.lowStockThreshold"]) || 0;
  const overdueDays = Number(s["finance.paymentOverdueDays"]) || 45;
  const found: Found[] = [];

  const products = await prisma.product.findMany({ where: { isActive: true } });
  for (const p of products) {
    const limit = Math.max(p.minimumStock, p.reorderPoint ?? 0, low);
    if (p.stock <= 0) found.push({ key: `out:${p.id}`, type: "stock.out", severity: "CRITICAL", message: `Tugagan: ${p.name}`, entityType: "Product", entityId: p.id });
    else if (p.stock <= limit) found.push({ key: `low:${p.id}`, type: "stock.low", severity: "WARNING", message: `Kam qolgan: ${p.name} (${p.stock})`, entityType: "Product", entityId: p.id });
    if (p.costPrice && p.price / 1.12 < p.costPrice) found.push({ key: `loss:${p.id}`, type: "price.belowCost", severity: "CRITICAL", message: `Narx tannarxdan past: ${p.name}`, entityType: "Product", entityId: p.id });
    if (!p.nameRu) found.push({ key: `noru:${p.id}`, type: "seo.noRu", severity: "INFO", message: `Ruscha nom yo'q: ${p.name}`, entityType: "Product", entityId: p.id });
    if (!p.imageUrl) found.push({ key: `noimg:${p.id}`, type: "seo.noImage", severity: "INFO", message: `Rasm yo'q: ${p.name}`, entityType: "Product", entityId: p.id });
  }

  const overdueBefore = new Date(Date.now() - overdueDays * 86400000);
  const overdue = await prisma.order.findMany({
    where: { status: { in: ["CONFIRMED", "SHIPPED", "COMPLETED"] }, paymentStatus: { in: ["UNPAID", "PARTIAL"] }, confirmedAt: { lt: overdueBefore } },
    include: { customer: true },
  });
  for (const o of overdue) found.push({ key: `overdue:${o.id}`, type: "payment.overdue", severity: "WARNING", message: `To'lov kechikdi: ${o.number} (${o.customer?.companyName ?? "—"})`, entityType: "Order", entityId: o.id });

  const newRfq = await prisma.rfqRequest.findMany({ where: { status: "NEW", createdAt: { lt: new Date(Date.now() - 24 * 3600000) } } });
  for (const r of newRfq) found.push({ key: `rfq:${r.id}`, type: "rfq.stale", severity: "WARNING", message: `Ariza 24 soatdan beri ko'rilmagan: ${r.companyName}`, entityType: "RfqRequest", entityId: r.id });

  const expiring = await prisma.quotation.findMany({ where: { status: "SENT", validUntil: { lt: new Date(Date.now() + 2 * 86400000) } } });
  for (const q of expiring) found.push({ key: `quote:${q.id}`, type: "quote.expiring", severity: "INFO", message: `Taklif muddati tugayapti: ${q.number}`, entityType: "Quotation", entityId: q.id });

  const keys = new Set(found.map((f) => f.key));
  for (const f of found) {
    await prisma.alert.upsert({
      where: { key: f.key },
      create: f,
      update: { message: f.message, severity: f.severity, resolvedAt: null },
    });
  }
  await prisma.alert.updateMany({ where: { resolvedAt: null, key: { notIn: [...keys] } }, data: { resolvedAt: new Date() } });
  return found.length;
}
