"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDocument } from "./actions";
import { BarcodeCameraScanner } from "@/components/barcode-camera-scanner";
import type { CreateStockDocumentInput } from "@/lib/stock-documents";

type Option = { id: string; name: string };
type ProductOption = { id: string; name: string; sku: string | null };

type DocLine = { productId: string; quantity: string; price: string };

const TYPE_OPTIONS: { value: CreateStockDocumentInput["type"]; label: string }[] = [
  { value: "RECEIPT", label: "Kirim" },
  { value: "ISSUE", label: "Chiqim" },
  { value: "TRANSFER", label: "Ko'chirish" },
  { value: "WRITE_OFF", label: "Hisobdan chiqarish" },
  { value: "INVENTORY", label: "Inventarizatsiya" },
  { value: "RETURN", label: "Qaytarish" },
];

export function DocumentForm({
  warehouses,
  suppliers,
  products,
}: {
  warehouses: Option[];
  suppliers: Option[];
  products: ProductOption[];
}) {
  const router = useRouter();

  const [type, setType] = useState<CreateStockDocumentInput["type"]>("RECEIPT");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [destWarehouseId, setDestWarehouseId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<DocLine[]>([
    { productId: products[0]?.id ?? "", quantity: "", price: "" },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [barcode, setBarcode] = useState("");
  const [scanStatus, setScanStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const needsPrice = type === "RECEIPT" || type === "ISSUE";
  const isInventory = type === "INVENTORY";

  // Shtrix-kod skaneri: barcode/SKU bo'yicha aniq moslikni topib,
  // mavjud qatorga qo'shadi (yoki yangi qator ochadi).
  // `rawCode` berilmasa — input qiymati ishlatiladi (klaviatura/Enter).
  async function handleBarcodeScan(rawCode?: string) {
    const q = (rawCode ?? barcode).trim();
    if (q.length < 2) return;
    setScanStatus(null);
    try {
      const res = await fetch(`/api/admin/product-lookup?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const match = (data.products ?? []).find(
        (p: { barcode: string | null; sku: string | null }) =>
          p.barcode === q || p.sku === q
      );
      const found = match ?? (data.products ?? [])[0];
      if (!found) {
        setScanStatus({ ok: false, text: `Topilmadi: ${q}` });
        setBarcode("");
        return;
      }
      // Avval shu mahsulotning mavjud qatorini topamiz, bo'lmasa qator ochamiz.
      setLines((l) => {
        const idx = l.findIndex((line) => line.productId === found.id);
        if (idx >= 0) {
          return l.map((line, i) =>
            i === idx
              ? { ...line, quantity: String((Number(line.quantity) || 0) + 1) }
              : line
          );
        }
        const emptyIdx = l.findIndex((line) => !line.quantity.trim());
        if (emptyIdx >= 0) {
          return l.map((line, i) =>
            i === emptyIdx ? { ...line, productId: found.id, quantity: "1" } : line
          );
        }
        return [...l, { productId: found.id, quantity: "1", price: "" }];
      });
      setScanStatus({ ok: true, text: `${found.name} — qo'shildi` });
      setBarcode("");
    } catch {
      setScanStatus({ ok: false, text: "Skanner so'rovi xatolik berdi." });
    }
  }

  function addLine() {
    setLines((l) => [
      ...l,
      { productId: products[0]?.id ?? "", quantity: "", price: "" },
    ]);
  }

  function removeLine(index: number) {
    setLines((l) => l.filter((_, i) => i !== index));
  }

  function updateLine(index: number, patch: Partial<DocLine>) {
    setLines((l) => l.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!warehouseId) {
      setError("Omborni tanlang.");
      return;
    }
    if (type === "TRANSFER" && !destWarehouseId) {
      setError("Manzil omborni tanlang.");
      return;
    }

    const items = lines
      .filter((l) => l.productId && l.quantity.trim())
      .map((l) => ({
        productId: l.productId,
        quantity: Number(l.quantity),
        price: needsPrice && l.price.trim() ? Number(l.price) : null,
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
    const result = await createDocument({
      type,
      warehouseId,
      destWarehouseId: type === "TRANSFER" ? destWarehouseId : null,
      supplierId: type === "RECEIPT" && supplierId ? supplierId : null,
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
            Hujjat turi
          </label>
          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value as CreateStockDocumentInput["type"])
            }
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {type === "TRANSFER" ? "Manba ombor" : "Ombor"}
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

        {type === "TRANSFER" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Manzil ombor
            </label>
            <select
              value={destWarehouseId}
              onChange={(e) => setDestWarehouseId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
            >
              <option value="">Tanlang...</option>
              {warehouses
                .filter((w) => w.id !== warehouseId)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {type === "RECEIPT" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Yetkazib beruvchi (ixtiyoriy)
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
            >
              <option value="">—</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

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
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label className="text-sm font-medium text-slate-700">
            Mahsulotlar {isInventory && "(haqiqiy sanoq miqdori)"}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addLine}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              + Qator qo&apos;shish
            </button>
          </div>
        </div>

        {/* Shtrix-kod skaneri */}
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            📷 Skaner
          </span>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleBarcodeScan();
              }
            }}
            placeholder="Shtrix-kod yoki ARTIKUL kiriting va Enter"
            className="w-72 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
          <button
            type="button"
            onClick={() => handleBarcodeScan()}
            className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Qo&apos;shish
          </button>
          <BarcodeCameraScanner onScan={(code) => void handleBarcodeScan(code)} />
          {scanStatus && (
            <span
              className={`text-xs font-medium ${
                scanStatus.ok ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {scanStatus.text}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {lines.map((line, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={line.productId}
                onChange={(e) => updateLine(i, { productId: e.target.value })}
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
                placeholder={isInventory ? "Haqiqiy son" : "Miqdor"}
                className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
              {needsPrice && (
                <input
                  type="number"
                  min={0}
                  value={line.price}
                  onChange={(e) => updateLine(i, { price: e.target.value })}
                  placeholder="Narx"
                  className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              )}
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
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Yaratilmoqda..." : "Qoralama sifatida saqlash"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/stock-documents")}
          className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Bekor qilish
        </button>
      </div>
    </form>
  );
}
