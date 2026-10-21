"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refundPaymentAction } from "./actions";

export function RefundPaymentButton({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm("To'lovni qaytarishni tasdiqlaysizmi? Yozuv o'chmaydi, holati REFUNDED bo'ladi.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await refundPaymentAction(id);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="whitespace-nowrap rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
      >
        {pending ? "…" : "Qaytarish"}
      </button>
      {error && <p className="max-w-[12rem] text-xs text-rose-600">{error}</p>}
    </div>
  );
}
