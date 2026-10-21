import { prisma } from "@/lib/prisma";
import { refreshAlerts } from "@/lib/alerts";
import { requirePagePermission } from "@/lib/require-permission";
import { RefreshAlertsButton } from "./refresh-button";
import { AlertRow } from "./alert-row";

export const dynamic = "force-dynamic";

const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: "Jiddiy",
  WARNING: "Ogohlantirish",
  INFO: "Ma'lumot",
};

export default async function AlertsPage(props: PageProps<"/admin/alerts">) {
  await requirePagePermission("stock.read");

  // Kirishda ogohlantirishlarni haqiqiy holat bilan sinxronlaymiz.
  await refreshAlerts();

  const sp = await props.searchParams;
  const show = typeof sp.show === "string" ? sp.show : "active";

  const where =
    show === "all"
      ? {}
      : show === "unread"
        ? { resolvedAt: null, readAt: null }
        : { resolvedAt: null };

  const [alerts, counts] = await Promise.all([
    prisma.alert.findMany({
      where,
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.alert.aggregate({
      where: { resolvedAt: null },
      _count: true,
    }),
  ]);

  const unreadCount = await prisma.alert.count({
    where: { resolvedAt: null, readAt: null },
  });

  const tabs = [
    { value: "active", label: `Faol (${counts._count})` },
    { value: "unread", label: `O'qilmagan (${unreadCount})` },
    { value: "all", label: "Barchasi" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ogohlantirishlar</h1>
          <p className="mt-1 text-slate-500">
            Haqiqiy ma&apos;lumotlardan hisoblanadi: kam qolgan mahsulotlar,
            kechikgan to&apos;lovlar, odatdan tashqari savdo va boshqalar.
          </p>
        </div>
        <RefreshAlertsButton />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = show === tab.value || (tab.value === "active" && !["unread", "all"].includes(show));
          return (
            <a
              key={tab.value}
              href={tab.value === "active" ? "/admin/alerts" : `/admin/alerts?show=${tab.value}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </a>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {alerts.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <p className="text-2xl">✅</p>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Faol ogohlantirish yo&apos;q — hamma narsa joyida.
            </p>
          </div>
        )}
        {alerts.map((alert) => (
          <AlertRow
            key={alert.id}
            alert={{
              id: alert.id,
              type: alert.type,
              severity: alert.severity,
              severityLabel: SEVERITY_LABELS[alert.severity] ?? alert.severity,
              title: alert.title,
              description: alert.description,
              entity: alert.entity,
              entityId: alert.entityId,
              createdAt: alert.createdAt.toISOString(),
              read: alert.readAt !== null,
              resolved: alert.resolvedAt !== null,
            }}
          />
        ))}
      </div>
    </div>
  );
}
