"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { convertRequestToOrder } from "./actions";

export function ConvertToOrderButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await convertRequestToOrder(requestId);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      router.push(`/admin/orders/${result.orderId}`);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="rounded-full border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
    >
      {pending ? "..." : "Buyurtmaga aylantirish"}
    </button>
  );
}
