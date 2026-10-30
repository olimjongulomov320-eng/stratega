import { ActionForm, Submit } from "@/components/admin/forms";
import { Field, inputCls } from "@/components/admin/ui";
import { savePriceList } from "./actions";

export function PriceListForm({ values = {} }: { values?: { id?: string; name?: string; code?: string; note?: string | null; isActive?: boolean } }) {
  return (
    <ActionForm action={savePriceList} className="grid max-w-3xl gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-3">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <Field label="Nomi *"><input name="name" required defaultValue={values.name} className={inputCls} placeholder="Masalan: Dilerlar −5%" /></Field>
      <Field label="Kod *"><input name="code" required defaultValue={values.code} className={inputCls} placeholder="DEALER" /></Field>
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={values.isActive ?? true} /> Faol</label>
      <Field label="Izoh" className="sm:col-span-3"><input name="note" defaultValue={values.note ?? ""} className={inputCls} /></Field>
      <div className="sm:col-span-3"><Submit>Saqlash</Submit></div>
    </ActionForm>
  );
}
