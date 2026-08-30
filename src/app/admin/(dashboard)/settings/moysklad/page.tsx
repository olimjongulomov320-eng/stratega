import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { SyncPanel } from "./sync-panel";

export const dynamic = "force-dynamic";

export default async function MoySkladSettingsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const settings = await prisma.integrationSettings.findUnique({
    where: { provider: "moysklad" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">MoySklad</h1>
      <p className="mt-1 text-slate-500">
        Mahsulotlar (nomi, narxi, ombordagi soni, surati) MoySklad&apos;dan
        avtomatik yuklab olinadi.
      </p>

      <div className="mt-6 max-w-2xl">
        <SyncPanel
          hasToken={Boolean(settings?.apiToken)}
          priceTypeName={settings?.priceTypeName ?? ""}
          isEnabled={settings?.isEnabled ?? false}
          lastSyncAt={settings?.lastSyncAt?.toISOString() ?? null}
          lastSyncStatus={settings?.lastSyncStatus ?? null}
          lastSyncError={settings?.lastSyncError ?? null}
          lastSyncSummary={
            (settings?.lastSyncSummary as {
              created: number;
              updated: number;
              hidden: number;
              skipped: number;
              durationMs: number;
            } | null) ?? null
          }
        />
      </div>
    </div>
  );
}
