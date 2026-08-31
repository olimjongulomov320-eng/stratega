"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setOrderStatus } from "./actions";
import type { OrderStatus } from "@/generated/prisma/client";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "DRAFT", label: "Qoralama" },
  { value: "CONFIRMED", label: "Tasdiqlandi" },
  { value: "PROCESSING", label: "Tayyorlanmoqda" },
  { value: "READY_TO_SHIP", label: "Jo'natishga tayyor" },
  { value: "SHIPPED", label: "Jo'natildi" },
  { value: "COMPLETED", label: "Yakunlandi" },
  { value: "CANCELLED", label: "Bekor qilindi" },
];

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as OrderStatus;
        if (
          next === "CANCELLED" &&
          !confirm("Buyurtmani bekor qilishni tasdiqlaysizmi?")
        ) {
          return;
        }
        startTransition(async () => {
          const result = await setOrderStatus(orderId, next);
          if (!result.ok) {
            alert(result.error);
            return;
          }
          router.refresh();
        });
      }}
      className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 disabled:opacity-50"
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
