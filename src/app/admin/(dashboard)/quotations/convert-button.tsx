"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { convertQuotationToOrderAction } from "./actions";

export function ConvertToOrderButton({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await convertQuotationToOrderAction(id);
      if (!result.ok) {
        setError(result.error);
      } else {
        router.push(`/admin/orders/${result.id}`);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="whitespace-nowrap rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? "..." : "Buyurtmaga aylantirish"}
      </button>
      {error && <p className="max-w-[12rem] text-xs text-rose-600">{error}</p>}
    </div>
  );
}
