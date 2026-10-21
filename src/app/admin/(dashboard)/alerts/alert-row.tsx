"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAlertReadAction, resolveAlertAction } from "./actions";

type AlertViewModel = {
  id: string;
  type: string;
  severity: string;
  severityLabel: string;
  title: string;
  description: string | null;
  entity: string | null;
  entityId: string | null;
  createdAt: string;
  read: boolean;
  resolved: boolean;
};

const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: "border-l-rose-500 bg-rose-50/40",
  WARNING: "border-l-amber-500 bg-amber-50/40",
  INFO: "border-l-sky-500 bg-sky-50/40",
};

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: "bg-rose-100 text-rose-700",
  WARNING: "bg-amber-100 text-amber-700",
  INFO: "bg-sky-100 text-sky-700",
};

// Tegishli sahifaga ko'chirish havolasi.
function hrefFor(alert: AlertViewModel): string | null {
  if (!alert.entity || !alert.entityId) return null;
  switch (alert.entity) {
    case "Product":
      return `/admin/products/${alert.entityId}/overview`;
    case "Order":
      return `/admin/orders/${alert.entityId}`;
    case "Payment":
      return "/admin/payments";
    default:
      return null;
  }
}

export function AlertRow({ alert }: { alert: AlertViewModel }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const href = hrefFor(alert);

  function markRead() {
    startTransition(async () => {
      const result = await markAlertReadAction(alert.id);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  function resolve() {
    startTransition(async () => {
      const result = await resolveAlertAction(alert.id);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div
      className={`rounded-xl border border-slate-200 border-l-4 p-4 ${
        SEVERITY_STYLE[alert.severity] ?? "border-l-slate-400"
      } ${alert.resolved ? "opacity-60" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                SEVERITY_BADGE[alert.severity] ?? "bg-slate-100 text-slate-600"
              }`}
            >
              {alert.severityLabel}
            </span>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {alert.type}
            </span>
            {!alert.read && (
              <span className="h-2 w-2 rounded-full bg-indigo-500" title="O'qilmagan" />
            )}
            {alert.resolved && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                Hal qilingan
              </span>
            )}
          </div>
          {href ? (
            <a
              href={href}
              className="mt-1.5 block font-semibold text-slate-800 hover:text-indigo-600"
            >
              {alert.title}
            </a>
          ) : (
            <p className="mt-1.5 font-semibold text-slate-800">{alert.title}</p>
          )}
          {alert.description && (
            <p className="mt-0.5 text-sm text-slate-500">{alert.description}</p>
          )}
          <p className="mt-1 text-xs text-slate-400">
            {new Date(alert.createdAt).toLocaleString("uz-UZ")}
          </p>
          {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        </div>

        {!alert.resolved && (
          <div className="flex shrink-0 gap-2">
            {!alert.read && (
              <button
                type="button"
                onClick={markRead}
                disabled={pending}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Ko&apos;rdim
              </button>
            )}
            <button
              type="button"
              onClick={resolve}
              disabled={pending}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Hal qildim
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
