"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveMoySkladSettings,
  testMoySkladConnection,
  syncMoySkladNow,
} from "./actions";

type SyncSummary = {
  created: number;
  updated: number;
  hidden: number;
  skipped: number;
  durationMs: number;
};

type SyncPanelProps = {
  hasToken: boolean;
  priceTypeName: string;
  isEnabled: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  lastSyncSummary: SyncSummary | null;
};

function StatusPill({ status }: { status: string | null }) {
  if (!status) return null;

  const styles: Record<string, string> = {
    SUCCESS: "bg-emerald-50 text-emerald-700",
    ERROR: "bg-rose-50 text-rose-700",
    RUNNING: "bg-amber-50 text-amber-700",
  };
  const labels: Record<string, string> = {
    SUCCESS: "Muvaffaqiyatli",
    ERROR: "Xatolik",
    RUNNING: "Bajarilmoqda",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-slate-100 text-slate-500"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

export function SyncPanel({
  hasToken,
  priceTypeName: initialPriceTypeName,
  lastSyncAt,
  lastSyncStatus,
  lastSyncError,
  lastSyncSummary,
}: SyncPanelProps) {
  const router = useRouter();

  const [apiToken, setApiToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [priceTypeName, setPriceTypeName] = useState(initialPriceTypeName);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<
    { ok: true } | { ok: false; error: string } | null
  >(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const result = await saveMoySkladSettings(apiToken, priceTypeName);
    setSaving(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setApiToken("");
    router.refresh();
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const result = await testMoySkladConnection();
    setTesting(false);
    setTestResult(result);
  }

  async function handleSyncNow() {
    setSyncing(true);
    await syncMoySkladNow();
    setSyncing(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleSave}
        className="rounded-xl border border-slate-200 bg-white p-6"
      >
        <h2 className="text-lg font-semibold text-slate-900">
          Ulanish sozlamalari
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          MoySklad shaxsiy kabinetida: Sozlamalar → Tashqi ilovalar uchun
          tokenlar bo&apos;limidan API token oling.
        </p>

        <div className="mt-4 flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              API token
            </label>
            <div className="flex gap-2">
              <input
                type={showToken ? "text" : "password"}
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder={
                  hasToken ? "•••••••••••••• (o'zgartirish uchun kiriting)" : "Tokenni joylashtiring"
                }
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50"
              >
                {showToken ? "Yashirish" : "Ko'rsatish"}
              </button>
            </div>
            {hasToken && (
              <p className="mt-1 text-xs text-slate-400">
                Token allaqachon saqlangan. Bo&apos;sh qoldirib
                &quot;Saqlash&quot;ni bossangiz, eski token o&apos;zgarmaydi.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Narx turi nomi (MoySklad&apos;dagi kabi)
            </label>
            <input
              value={priceTypeName}
              onChange={(e) => setPriceTypeName(e.target.value)}
              placeholder="Цена продажи"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        {formError && (
          <p className="mt-3 text-sm text-rose-600">{formError}</p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>

          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !hasToken}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {testing ? "Tekshirilmoqda..." : "Ulanishni tekshirish"}
          </button>

          {testResult && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                testResult.ok
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {testResult.ok ? "Ulanish muvaffaqiyatli" : testResult.error}
            </span>
          )}
        </div>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Sinxronizatsiya
          </h2>
          <StatusPill status={lastSyncStatus} />
        </div>

        <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <p>
            <span className="text-slate-400">Oxirgi sinxronizatsiya: </span>
            {lastSyncAt
              ? new Date(lastSyncAt).toLocaleString("uz-UZ")
              : "Hali bo'lmagan"}
          </p>
          {lastSyncSummary && (
            <p>
              <span className="text-slate-400">Natija: </span>
              Yaratildi {lastSyncSummary.created}, yangilandi{" "}
              {lastSyncSummary.updated}, berkitildi {lastSyncSummary.hidden},
              o&apos;tkazib yuborildi {lastSyncSummary.skipped}
            </p>
          )}
        </div>

        {lastSyncStatus === "ERROR" && lastSyncError && (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
            {lastSyncError}
          </div>
        )}

        <button
          type="button"
          onClick={handleSyncNow}
          disabled={syncing || !hasToken}
          className="mt-5 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {syncing ? "Sinxronlanmoqda..." : "Hozir sinxronlash"}
        </button>
      </div>
    </div>
  );
}
