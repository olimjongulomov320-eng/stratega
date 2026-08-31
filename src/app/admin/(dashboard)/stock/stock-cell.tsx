"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adjustStock } from "./actions";

export function StockCell({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(stock));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const numValue = Number(value);
  const isDirty =
    Number.isInteger(numValue) && numValue >= 0 && numValue !== stock;

  const toneClass =
    stock <= 0
      ? "border-rose-300 bg-rose-50 text-rose-700"
      : stock <= 5
        ? "border-amber-300 bg-amber-50 text-amber-700"
        : "border-slate-200 text-slate-700";

  useEffect(() => {
    if (!justSaved) return;
    const timeout = setTimeout(() => setJustSaved(false), 1400);
    return () => clearTimeout(timeout);
  }, [justSaved]);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await adjustStock(productId, numValue);
      if (!result.ok) {
        setError(result.error);
        setValue(String(stock));
        return;
      }
      setJustSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={pending}
        className={`w-16 rounded-lg border px-2 py-1.5 text-sm outline-none transition-all duration-200 focus:border-indigo-400 disabled:opacity-50 ${
          justSaved
            ? "animate-save-pulse border-emerald-400 bg-emerald-50 text-emerald-700"
            : toneClass
        }`}
      />
      {isDirty && !pending && (
        <button
          type="button"
          onClick={handleSave}
          className="animate-fade-in-up rounded-lg bg-indigo-50 px-2 py-1.5 text-xs font-semibold text-indigo-600 transition-all duration-150 hover:scale-105 hover:bg-indigo-100"
        >
          Saqlash
        </button>
      )}
      {pending && (
        <span className="text-xs text-slate-400">Saqlanmoqda...</span>
      )}
      {justSaved && !pending && (
        <span className="animate-fade-in-up text-xs font-medium text-emerald-600">
          ✓ Saqlandi
        </span>
      )}
      {error && (
        <span className="animate-fade-in-up text-xs text-rose-600">
          {error}
        </span>
      )}
    </div>
  );
}
