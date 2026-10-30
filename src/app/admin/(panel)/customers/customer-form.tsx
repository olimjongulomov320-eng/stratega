import { ActionForm, Submit } from "@/components/admin/forms";
import { Field, inputCls } from "@/components/admin/ui";
import { saveCustomer } from "./actions";

type V = {
  id?: string; companyName?: string; contactName?: string | null; phone?: string | null; email?: string | null; inn?: string | null;
  address?: string | null; priceListId?: string | null; creditLimit?: number | null; note?: string | null; isActive?: boolean;
};

export function CustomerForm({ values = {}, priceLists, returnTo }: { values?: V; priceLists: { id: string; name: string }[]; returnTo?: string }) {
  return (
    <ActionForm action={saveCustomer} className="grid max-w-3xl gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <Field label="Kompaniya nomi *"><input name="companyName" required defaultValue={values.companyName} className={inputCls} /></Field>
      <Field label="Aloqa shaxsi"><input name="contactName" defaultValue={values.contactName ?? ""} className={inputCls} /></Field>
      <Field label="Telefon"><input name="phone" defaultValue={values.phone ?? ""} className={inputCls} /></Field>
      <Field label="Email"><input name="email" type="email" defaultValue={values.email ?? ""} className={inputCls} /></Field>
      <Field label="INN (STIR)"><input name="inn" defaultValue={values.inn ?? ""} className={inputCls} /></Field>
      <Field label="Manzil"><input name="address" defaultValue={values.address ?? ""} className={inputCls} /></Field>
      <Field label="Narx ro'yxati">
        <select name="priceListId" defaultValue={values.priceListId ?? ""} className={inputCls}>
          <option value="">Standart (sayt narxi)</option>
          {priceLists.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Kredit limiti (so'm)" hint="Ixtiyoriy"><input name="creditLimit" inputMode="numeric" defaultValue={values.creditLimit ?? ""} className={inputCls} /></Field>
      <Field label="Izoh" className="sm:col-span-2"><textarea name="note" rows={2} defaultValue={values.note ?? ""} className={inputCls} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={values.isActive ?? true} /> Faol</label>
      <div className="sm:col-span-2"><Submit>Saqlash</Submit></div>
    </ActionForm>
  );
}
