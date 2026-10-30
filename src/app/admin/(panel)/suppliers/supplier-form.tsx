import { ActionForm, Submit } from "@/components/admin/forms";
import { Field, inputCls } from "@/components/admin/ui";
import { saveSupplier } from "./actions";

type V = { id?: string; name?: string; legalName?: string | null; inn?: string | null; contactName?: string | null; phone?: string | null; email?: string | null; address?: string | null; country?: string | null; note?: string | null; isActive?: boolean };

export function SupplierForm({ values = {} }: { values?: V }) {
  return (
    <ActionForm action={saveSupplier} className="grid max-w-3xl gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <Field label="Nomi *"><input name="name" required defaultValue={values.name} className={inputCls} /></Field>
      <Field label="Yuridik nomi"><input name="legalName" defaultValue={values.legalName ?? ""} className={inputCls} /></Field>
      <Field label="INN / Tax ID"><input name="inn" defaultValue={values.inn ?? ""} className={inputCls} /></Field>
      <Field label="Mamlakat"><input name="country" defaultValue={values.country ?? ""} className={inputCls} /></Field>
      <Field label="Aloqa shaxsi"><input name="contactName" defaultValue={values.contactName ?? ""} className={inputCls} /></Field>
      <Field label="Telefon / WeChat"><input name="phone" defaultValue={values.phone ?? ""} className={inputCls} /></Field>
      <Field label="Email"><input name="email" type="email" defaultValue={values.email ?? ""} className={inputCls} /></Field>
      <Field label="Manzil"><input name="address" defaultValue={values.address ?? ""} className={inputCls} /></Field>
      <Field label="Izoh (to'lov shartlari va h.k.)" className="sm:col-span-2"><textarea name="note" rows={2} defaultValue={values.note ?? ""} className={inputCls} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={values.isActive ?? true} /> Faol</label>
      <div className="sm:col-span-2"><Submit>Saqlash</Submit></div>
    </ActionForm>
  );
}
