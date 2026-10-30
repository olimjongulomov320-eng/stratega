import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { PageHeader, Badge, Empty, btn } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/forms";
import { formatDate } from "@/lib/format";
import { recalcAlerts } from "@/lib/alerts";
import { recalc, markRead } from "./actions";

const LINK: Record<string, string> = { Product: "/admin/products/{id}/overview", Order: "/admin/orders/{id}", RfqRequest: "/admin/requests", Quotation: "/admin/quotations/{id}" };
const TONE = { CRITICAL: "red", WARNING: "amber", INFO: "blue" } as const;

export default async function AlertsPage(props: PageProps<"/admin/alerts">) {
  await requirePage("stock.read");
  const sp = await props.searchParams;
  const view = typeof sp.view === "string" ? sp.view : "active";
  // Keep alerts fresh on every visit.
  await recalcAlerts();
  const alerts = await prisma.alert.findMany({
    where: view === "all" ? {} : view === "unread" ? { isRead: false, resolvedAt: null } : { resolvedAt: null },
    orderBy: [{ resolvedAt: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
    take: 300,
  });
  return (
    <div>
      <PageHeader
        title="Ogohlantirishlar"
        description="Haqiqiy ma'lumotlardan hisoblanadi: tugagan va kam qolgan mahsulotlar, tannarxdan past narx, kechikkan to'lovlar, ko'rilmagan arizalar, SEO kamchiliklari."
        actions={
          <>
            {["active", "unread", "all"].map((v) => (
              <Link key={v} href={`/admin/alerts?view=${v}`} className={btn(view === v ? "primary" : "secondary", "sm")}>{v === "active" ? "Faol" : v === "unread" ? "O'qilmagan" : "Barchasi"}</Link>
            ))}
            <ActionButton action={recalc}>Qayta hisoblash</ActionButton>
            <ActionButton action={markRead} fields={{ id: "all" }}>Hammasini o&apos;qildi</ActionButton>
          </>
        }
      />
      {alerts.length === 0 ? (
        <Empty>✅ Faol ogohlantirish yo&apos;q — hamma narsa joyida.</Empty>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
          {alerts.map((a) => {
            const href = a.entityType && a.entityId ? LINK[a.entityType]?.replace("{id}", a.entityId) : undefined;
            return (
              <li key={a.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 text-sm ${a.isRead ? "opacity-60" : ""}`}>
                <Badge tone={TONE[a.severity]}>{a.severity === "CRITICAL" ? "Muhim" : a.severity === "WARNING" ? "Diqqat" : "Ma'lumot"}</Badge>
                <span className="flex-1">{href ? <Link href={href} className="hover:text-indigo-600">{a.message}</Link> : a.message}</span>
                {a.resolvedAt && <Badge tone="green">Hal bo&apos;ldi</Badge>}
                <span className="text-xs text-slate-400">{formatDate(a.createdAt, true)}</span>
                {!a.isRead && !a.resolvedAt && <ActionButton action={markRead} fields={{ id: a.id }} variant="ghost">O&apos;qildi</ActionButton>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
