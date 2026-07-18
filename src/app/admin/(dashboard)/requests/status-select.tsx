"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateRequestStatus } from "./actions";
import type { RfqStatus } from "@/generated/prisma/client";

const STATUS_OPTIONS: { value: RfqStatus; label: string }[] = [
  { value: "NEW", label: "Yangi" },
  { value: "IN_REVIEW", label: "Ko'rib chiqilmoqda" },
  { value: "QUOTED", label: "Narx taqdim etildi" },
  { value: "CONFIRMED", label: "Tasdiqlandi" },
  { value: "CANCELLED", label: "Bekor qilindi" },
];

export function StatusSelect({
  requestId,
  status,
}: {
  requestId: string;
  status: RfqStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as RfqStatus;
        startTransition(async () => {
          await updateRequestStatus(requestId, next);
          router.refresh();
        });
      }}
      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400 disabled:opacity-50"
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
