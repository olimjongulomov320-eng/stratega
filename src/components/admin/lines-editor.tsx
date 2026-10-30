"use client";

import { useMemo, useState } from "react";
import { BarcodeCameraScanner } from "./barcode-camera-scanner";
import { inputCls, btn } from "./ui";
import { formatNumber } from "@/lib/format";

export type LineProduct = { id: string; name: string; sku: string | null; barcode?: string | null; price: number; costPrice?: number | null; available?: number };
import type { Line } from "@/lib/lines";
export type { Line };

/** Editable list of product lines. Serialized into a hidden <input name="lines"> as JSON. */
export function LinesEditor({
  products,
  initial = [],
  priceLabel,
  priceField = "price",
  showAvailable = false,
}: {
  products: LineProduct[];
  initial?: Line[];
  /** Column label for the per-line money value; omit to hide the column. */
  priceLabel?: string;
  /** Default price source when a product is chosen. */
  priceField?: "price" | "costPrice";
  showAvailable?: boolean;
}) {
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const [lines, setLines] = useState<Line[]>(initial.length ? initial : [{ productId: "", quantity: 1 }]);
  const [filter, setFilter] = useState("");
  const [scan, setScan] = useState("");
  const [scanMsg, setScanMsg] = useState<{ ok: boolean; text: string } | null>(null);

  /** Barcode / SKU scan: exact match on barcode or SKU adds the product, or +1 if it is already in the list. */
  const addByCode = (raw: string) => {
    const code = raw.trim();
    if (code.length < 2) return;
    const lc = code.toLowerCase();
    const found = products.find((p) => p.barcode === code || (p.sku ?? "").toLowerCase() === lc);
    setScan("");
    if (!found) {
      setScanMsg({ ok: false, text: `Topilmadi: ${code}` });
      return;
    }
    const price = priceField === "costPrice" ? found.costPrice ?? undefined : found.price;
    setLines((ls) => {
      const idx = ls.findIndex((l) => l.productId === found.id);
      if (idx >= 0) return ls.map((l, j) => (j === idx ? { ...l, quantity: (l.quantity || 0) + 1 } : l));
      const empty = ls.findIndex((l) => !l.productId);
      if (empty >= 0) return ls.map((l, j) => (j === empty ? { productId: found.id, quantity: 1, price } : l));
      return [...ls, { productId: found.id, quantity: 1, price }];
    });
    setScanMsg({ ok: true, text: `+1 ${found.name}` });
  };

  const update = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const filtered = filter
    ? products.filter((p) => `${p.name} ${p.sku ?? ""}`.toLowerCase().includes(filter.toLowerCase()))
    : products;
  const total = lines.reduce((s, l) => s + (l.price ?? 0) * (l.quantity || 0), 0);
  const valid = lines.filter((l) => l.productId && l.quantity > 0);

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="lines" value={JSON.stringify(valid)} />
      <div className="flex flex-wrap items-center gap-2">
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Mahsulot qidirish (nomi yoki SKU)..." className={`${inputCls} max-w-sm`} />
        <input
          value={scan}
          onChange={(e) => setScan(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addByCode(scan);
            }
          }}
          placeholder="Shtrix-kod yoki SKU + Enter"
          aria-label="Shtrix-kod skaneri"
          className={`${inputCls} max-w-[15rem]`}
        />
        <BarcodeCameraScanner onScan={addByCode} />
        {scanMsg && <span className={`text-xs font-medium ${scanMsg.ok ? "text-emerald-600" : "text-rose-600"}`}>{scanMsg.text}</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pr-2">Mahsulot</th>
              {showAvailable && <th className="w-24 py-2 pr-2 text-right">Mavjud</th>}
              <th className="w-28 py-2 pr-2">Miqdor</th>
              {priceLabel && <th className="w-40 py-2 pr-2">{priceLabel}</th>}
              {priceLabel && <th className="w-36 py-2 pr-2 text-right">Summa</th>}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => {
              const p = byId.get(line.productId);
              return (
                <tr key={i} className="border-t border-slate-100">
                  <td className="py-2 pr-2">
                    <select
                      value={line.productId}
                      onChange={(e) => {
                        const np = byId.get(e.target.value);
                        update(i, { productId: e.target.value, price: np ? (priceField === "costPrice" ? np.costPrice ?? undefined : np.price) : undefined });
                      }}
                      className={inputCls}
                    >
                      <option value="">— mahsulotni tanlang —</option>
                      {(p && !filtered.includes(p) ? [p, ...filtered] : filtered).map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                          {o.sku ? ` (${o.sku})` : ""}
                        </option>
                      ))}
                    </select>
                  </td>
                  {showAvailable && <td className="py-2 pr-2 text-right tabular-nums text-slate-500">{p?.available ?? "—"}</td>}
                  <td className="py-2 pr-2">
                    <input type="number" min={0} value={line.quantity} onChange={(e) => update(i, { quantity: Math.max(0, Number(e.target.value)) })} className={inputCls} />
                  </td>
                  {priceLabel && (
                    <td className="py-2 pr-2">
                      <input type="number" min={0} value={line.price ?? ""} onChange={(e) => update(i, { price: e.target.value === "" ? undefined : Number(e.target.value) })} className={inputCls} />
                    </td>
                  )}
                  {priceLabel && <td className="py-2 pr-2 text-right tabular-nums">{formatNumber((line.price ?? 0) * line.quantity)}</td>}
                  <td className="py-2 text-right">
                    <button type="button" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500" aria-label="Qatorni o'chirish">
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setLines((ls) => [...ls, { productId: "", quantity: 1 }])} className={btn("secondary", "sm")}>
          + Qator qo&apos;shish
        </button>
        {priceLabel && <p className="text-sm font-semibold">Jami: {formatNumber(total)} so&apos;m</p>}
      </div>
    </div>
  );
}

