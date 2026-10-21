"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  postShipmentAction,
  markShipmentReadyAction,
  deliverShipmentAction,
  cancelShipmentAction,
} from "./actions";
import type { ShipmentStatus } from "@/generated/prisma/client";

type ActionKey = "ready" | "post" | "deliver" | "cancel";

const ACTION_LABELS: Record<ActionKey, string> = {
  ready: "Tayyorlash",
  post: "Qayd etish (jo'natish)",
  deliver: "Yetkazildi",
  cancel: "Bekor qilish",
};

// Qonuniy holat o'tishlari (server ham tekshiradi).
const AVAILABLE: Record<ShipmentStatus, ActionKey[]> = {
  DRAFT: ["ready", "cancel"],
  READY: ["post", "cancel"],
  SHIPPED: ["deliver"],
  DELIVERED: [],
  CANCELLED: [],
};

export function ShipmentStatusActions({
  id,
  status,
}: {
  id: string;
  status: ShipmentStatus;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const actions = AVAILABLE[status] ?? [];
  if (actions.length === 0) return <span className="text-xs text-slate-400">—</span>;

  function run(action: ActionKey) {
    setError(null);
    startTransition(async () => {
      const fn =
        action === "ready"
          ? markShipmentReadyAction
          : action === "post"
            ? postShipmentAction
            : action === "deliver"
              ? deliverShipmentAction
              : cancelShipmentAction;
      const result = await fn(id);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1.5">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            disabled={pending}
            onClick={() => run(action)}
            className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
              action === "cancel"
                ? "border border-rose-200 text-rose-600 hover:bg-rose-50"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {pending ? "…" : ACTION_LABELS[action]}
          </button>
        ))}
      </div>
      {error && <p className="max-w-[14rem] text-xs text-rose-600">{error}</p>}
    </div>
  );
}
