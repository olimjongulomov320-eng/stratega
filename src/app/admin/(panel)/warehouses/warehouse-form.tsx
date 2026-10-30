import { ActionForm, Submit } from "@/components/admin/forms";
import { Field, inputCls } from "@/components/admin/ui";
import { saveWarehouse } from "./actions";

type V = { id?: string; name?: string; code?: string; address?: string | null; note?: string | null; isActive?: boolean; isDefault?: boolean };

export function WarehouseForm({ values = {} }: { values?: V }) {
  return (
    <ActionForm action={saveWarehouse} className="grid max-w-3xl gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <Field label="Ombor nomi *"><input name="name" required defaultValue={values.name} className={inputCls} /></Field>
      <Field label="Kod *" hint="Masalan MAIN, SERGELI"><input name="code" required defaultValue={values.code} className={inputCls} /></Field>
      <Field label="Manzil" className="sm:col-span-2"><input name="address" defaultValue={values.address ?? ""} className={inputCls} /></Field>
      <Field label="Izoh" className="sm:col-span-2"><textarea name="note" rows={2} defaultValue={values.note ?? ""} className={inputCls} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={values.isActive ?? true} /> Faol</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isDefault" defaultChecked={values.isDefault ?? false} /> Asosiy ombor (CSV import va yangi buyurtmalar uchun)</label>
      <div className="sm:col-span-2"><Submit>Saqlash</Submit></div>
    </ActionForm>
  );
}
