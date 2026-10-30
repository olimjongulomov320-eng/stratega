"use client";

import { useState } from "react";
import { ActionForm, Submit } from "@/components/admin/forms";
import { Field, inputCls } from "@/components/admin/ui";
import { LinesEditor, type LineProduct } from "@/components/admin/lines-editor";
import { DOC_TYPE } from "@/lib/labels";
import { createDocument } from "./actions";

type Opt = { id: string; name: string };

export function DocForm({ products, warehouses, suppliers, initialType }: { products: LineProduct[]; warehouses: Opt[]; suppliers: Opt[]; initialType: string }) {
  const [type, setType] = useState(initialType);
  const hint: Record<string, string> = {
    RECEIPT: "Yetkazib beruvchidan kelgan mahsulot. Birlik tannarxi kiritilsa — mahsulot tannarxi yangilanadi.",
    ISSUE: "Ombordan chiqim (sotuvsiz: namunalar, ichki ehtiyoj).",
    TRANSFER: "Bir ombordan boshqasiga ko'chirish.",
    WRITE_OFF: "Shikastlangan yoki yo'qolgan mahsulotni hisobdan chiqarish.",
    INVENTORY: "Sanab chiqilgan haqiqiy miqdorni kiriting — farq avtomatik yoziladi.",
    RETURN: "Mijozdan qaytgan mahsulot (omborga kirim).",
  };
  return (
    <ActionForm action={createDocument} className="flex flex-col gap-5">
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-3">
        <Field label="Hujjat turi">
          <select name="type" value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            {Object.entries(DOC_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label={type === "TRANSFER" ? "Qaysi ombordan" : "Ombor"}>
          <select name="warehouseId" className={inputCls}>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
        </Field>
        {type === "TRANSFER" && (
          <Field label="Qaysi omborga">
            <select name="targetWarehouseId" className={inputCls}>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
          </Field>
        )}
        {type === "RECEIPT" && (
          <Field label="Yetkazib beruvchi (ixtiyoriy)">
            <select name="supplierId" className={inputCls}>
              <option value="">—</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Izoh" className="sm:col-span-3"><input name="note" className={inputCls} placeholder="Masalan: shartnoma CHAONENG-05-2026" /></Field>
        <p className="text-xs text-slate-500 sm:col-span-3">{hint[type]}</p>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-slate-800">Mahsulotlar</h2>
        <LinesEditor
          key={type}
          products={products}
          priceLabel={type === "RECEIPT" ? "Birlik tannarxi (so'm)" : undefined}
          priceField="costPrice"
          showAvailable
        />
      </section>
      <div className="flex gap-2">
        <Submit name="intent" value="post">O&apos;tkazish (qoldiqqa yozish)</Submit>
        <Submit name="intent" value="draft" variant="secondary">Qoralama sifatida saqlash</Submit>
      </div>
    </ActionForm>
  );
}
