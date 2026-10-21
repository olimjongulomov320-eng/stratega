"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createShipmentAction } from "./actions";

// Buyurtma sahifasidan to'liq qoldiq bo'yicha jo'natma yaratish.
export function CreateShipmentButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await createShipmentAction(orderId);
      if (!result.ok) setError(result.error);
      else {
        router.push(`/admin/shipments/${result.id}`);
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
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? "..." : "+ Jo'natma yaratish"}
      </button>
      {error && <p className="max-w-[16rem] text-xs text-rose-600">{error}</p>}
    </div>
  );
}
