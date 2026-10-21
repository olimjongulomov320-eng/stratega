"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setQuotationStatusAction } from "./actions";
import type { QuotationStatus } from "@/generated/prisma/client";

// Faqat qonuniy o'tishlar ko'rsatiladi (server ham qayta tekshiradi).
const OPTIONS: Record<QuotationStatus, { value: QuotationStatus; label: string }[]> = {
  DRAFT: [
    { value: "SENT", label: "Yuborish" },
    { value: "REJECTED", label: "Rad etish" },
  ],
  SENT: [
    { value: "ACCEPTED", label: "Qabul qilindi" },
    { value: "REJECTED", label: "Rad etildi" },
    { value: "EXPIRED", label: "Muddati tugadi" },
  ],
  ACCEPTED: [],
  REJECTED: [{ value: "DRAFT", label: "Qayta qoralama" }],
  EXPIRED: [{ value: "DRAFT", label: "Qayta qoralama" }],
};

export function QuotationStatusSelect({
  id,
  status,
}: {
  id: string;
  status: QuotationStatus;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const options = OPTIONS[status] ?? [];
  if (options.length === 0) return null;

  function handleChange(value: string) {
    setError(null);
    startTransition(async () => {
      const result = await setQuotationStatusAction(
        id,
        value as QuotationStatus
      );
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value=""
        disabled={pending}
        onChange={(e) => e.target.value && handleChange(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none hover:border-slate-300 disabled:opacity-50"
      >
        <option value="">Holat…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
