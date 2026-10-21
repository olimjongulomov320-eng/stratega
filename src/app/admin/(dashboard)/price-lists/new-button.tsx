"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPriceListAction } from "./actions";

export function NewPriceListButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Nomni kiriting.");
      return;
    }
    startTransition(async () => {
      const result = await createPriceListAction({ name, isDefault });
      if (!result.ok) setError(result.error);
      else {
        setOpen(false);
        setName("");
        setIsDefault(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        + Yangi ro&apos;yxat
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
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <h3 className="text-lg font-bold text-slate-900">Yangi narxlar ro&apos;yxati</h3>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Nom
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="masalan: Ulgurji narxlar"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          Asosiy (default) ro&apos;yxat qilish
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
            {pending ? "..." : "Yaratish"}
          </button>
        </div>
      </form>
    </div>
  );
}
