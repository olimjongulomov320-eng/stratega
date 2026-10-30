"use client";

import { ActionForm, Submit } from "@/components/admin/forms";
import { Field, inputCls } from "@/components/admin/ui";
import { LinesEditor, type LineProduct, type Line } from "@/components/admin/lines-editor";
import type { ActionState } from "@/lib/admin-types";

export function OrderForm({
  action,
  id,
  products,
  customers,
  warehouses,
  values,
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  id?: string;
  products: LineProduct[];
  customers: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  values?: { customerId?: string | null; warehouseId?: string; note?: string | null; lines?: Line[] };
}) {
  return (
    <ActionForm action={action} className="flex flex-col gap-5">
      {id && <input type="hidden" name="id" value={id} />}
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-3">
        <Field label="Mijoz">
          <select name="customerId" defaultValue={values?.customerId ?? ""} className={inputCls}>
            <option value="">— chakana / tanlanmagan —</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Ombor">
          <select name="warehouseId" defaultValue={values?.warehouseId} className={inputCls}>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
        </Field>
        <Field label="Izoh"><input name="note" defaultValue={values?.note ?? ""} className={inputCls} /></Field>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <LinesEditor products={products} initial={values?.lines} priceLabel="Narx (so'm, QQS bilan)" showAvailable />
        <p className="mt-2 text-xs text-slate-400">Narx bo&apos;sh qolsa — mijozning narx ro&apos;yxati yoki sayt narxi olinadi.</p>
      </section>
      <div><Submit>{id ? "Saqlash" : "Buyurtma yaratish"}</Submit></div>
    </ActionForm>
  );
}
