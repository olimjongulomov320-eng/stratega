"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordPaymentAction } from "./actions";

type OrderOption = { id: string; label: string; outstanding: number };

const METHODS = ["naqd", "bank o'tkazmasi", "karta", "boshqa"];

export function RecordPaymentButton({ orders }: { orders: OrderOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(METHODS[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = orders.find((o) => o.id === orderId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!orderId) {
      setError("Buyurtmani tanlang.");
      return;
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Summa musbat bo'lishi kerak.");
      return;
    }
    startTransition(async () => {
      const result = await recordPaymentAction(orderId, {
        amount: Math.round(value),
        method,
        note: note.trim() || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setAmount("");
      setNote("");
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={orders.length === 0}
        className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        + To&apos;lov qabul qilish
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <h3 className="text-lg font-bold text-slate-900">To&apos;lov qabul qilish</h3>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Buyurtma
          <select
            value={orderId}
            onChange={(e) => {
              setOrderId(e.target.value);
              const opt = orders.find((o) => o.id === e.target.value);
              if (opt) setAmount(String(opt.outstanding));
            }}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          >
            <option value="">Tanlang…</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label} — qarz {o.outstanding.toLocaleString("uz-UZ")}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-3 block text-sm font-medium text-slate-700">
          Summa (so&apos;m)
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>
        {selected && (
          <p className="mt-1 text-xs text-slate-400">
            Qolgan qarz: {selected.outstanding.toLocaleString("uz-UZ")} so&apos;m
          </p>
        )}

        <label className="mt-3 block text-sm font-medium text-slate-700">
          To&apos;lov usuli
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-3 block text-sm font-medium text-slate-700">
          Izoh
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ixtiyoriy"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending ? "..." : "Qayd etish"}
          </button>
        </div>
      </form>
    </div>
  );
}
