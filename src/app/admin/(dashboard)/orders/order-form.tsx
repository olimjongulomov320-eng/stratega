"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrderAction } from "./actions";

type CustomerOption = { id: string; companyName: string };
type WarehouseOption = { id: string; name: string };
type ProductOption = { id: string; name: string; price: number; sku: string | null };

type OrderLine = { productId: string; quantity: string; price: string };

export function OrderForm({
  customers,
  warehouses,
  products,
}: {
  customers: CustomerOption[];
  warehouses: WarehouseOption[];
  products: ProductOption[];
}) {
  const router = useRouter();

  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([
    {
      productId: products[0]?.id ?? "",
      quantity: "",
      price: products[0] ? String(products[0].price) : "",
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addLine() {
    const first = products[0];
    setLines((l) => [
      ...l,
      { productId: first?.id ?? "", quantity: "", price: first ? String(first.price) : "" },
    ]);
  }

  function removeLine(index: number) {
    setLines((l) => l.filter((_, i) => i !== index));
  }

  function updateLine(index: number, patch: Partial<OrderLine>) {
    setLines((l) => l.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function handleProductChange(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateLine(index, {
      productId,
      price: product ? String(product.price) : "",
    });
  }

  const total = lines.reduce((sum, l) => {
    const qty = Number(l.quantity) || 0;
    const price = Number(l.price) || 0;
    return sum + qty * price;
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const items = lines
      .filter((l) => l.productId && l.quantity.trim())
      .map((l) => ({
        productId: l.productId,
        quantity: Number(l.quantity),
        price: Number(l.price) || 0,
      }));

    if (items.length === 0) {
      setError("Kamida bitta mahsulot qatorini to'ldiring.");
      return;
    }
    if (items.some((i) => !Number.isFinite(i.quantity) || i.quantity <= 0)) {
      setError("Miqdorlar musbat son bo'lishi kerak.");
      return;
    }

    setSubmitting(true);
    const result = await createOrderAction({
      customerId: customerId || null,
      warehouseId: warehouseId || null,
      note: note.trim() || null,
      items,
    });
    setSubmitting(false);

    if (result && !result.ok) {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Mijoz (ixtiyoriy)
          </label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
          >
            <option value="">—</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Ombor
          </label>
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Izoh
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">
            Mahsulotlar
          </label>
          <button
            type="button"
            onClick={addLine}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            + Qator qo&apos;shish
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {lines.map((line, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={line.productId}
                onChange={(e) => handleProductChange(i, e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.sku ? ` (${p.sku})` : ""}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                value={line.quantity}
                onChange={(e) => updateLine(i, { quantity: e.target.value })}
                placeholder="Miqdor"
                className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
              <input
                type="number"
                min={0}
                value={line.price}
                onChange={(e) => updateLine(i, { price: e.target.value })}
                placeholder="Narx"
                className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
              {lines.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="rounded-lg px-2 py-2 text-sm text-rose-600 hover:bg-rose-50"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="mt-3 text-right text-sm font-semibold text-slate-700">
          Jami: {total.toLocaleString("uz-UZ")} so&apos;m
        </p>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Yaratilmoqda..." : "Buyurtma yaratish"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/orders")}
          className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Bekor qilish
        </button>
      </div>
    </form>
  );
}
