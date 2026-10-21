"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setOrderStatus } from "./actions";
import type { OrderStatus } from "@/generated/prisma/client";

const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Qoralama",
  CONFIRMED: "Tasdiqlandi",
  PROCESSING: "Tayyorlanmoqda",
  READY_TO_SHIP: "Jo'natishga tayyor",
  SHIPPED: "Jo'natildi",
  COMPLETED: "Yakunlandi",
  CANCELLED: "Bekor qilindi",
};

// Faqat qonuniy o'tishlar ko'rsatiladi; server ORDER_TRANSITIONS bo'yicha
// qayta tekshiradi.
const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "READY_TO_SHIP", "CANCELLED"],
  PROCESSING: ["READY_TO_SHIP", "CANCELLED"],
  READY_TO_SHIP: ["SHIPPED", "PROCESSING", "CANCELLED"],
  SHIPPED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const options = ALLOWED[status] ?? [];

  if (options.length === 0) {
    return (
      <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
        {STATUS_LABELS[status]}
      </span>
    );
  }

  function handleChange(value: string) {
    const next = value as OrderStatus;
    if (
      next === "CANCELLED" &&
      !window.confirm("Buyurtmani bekor qilishni tasdiqlaysizmi? Zaxira ochiladi.")
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await setOrderStatus(orderId, next);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value=""
        disabled={pending}
        onChange={(e) => e.target.value && handleChange(e.target.value)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 disabled:opacity-50"
      >
        <option value="">Holatni o&apos;zgartirish…</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {STATUS_LABELS[opt]}
          </option>
        ))}
      </select>
      {error && <p className="max-w-xs text-right text-xs text-rose-600">{error}</p>}
    </div>
  );
}
