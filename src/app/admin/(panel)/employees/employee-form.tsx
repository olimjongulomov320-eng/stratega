import { ActionForm, Submit } from "@/components/admin/forms";
import { Field, inputCls } from "@/components/admin/ui";
import { ROLE_LABELS } from "@/lib/permissions";
import { saveEmployee } from "./actions";

type V = { id?: string; name?: string; email?: string; phone?: string | null; role?: string; isActive?: boolean };

export function EmployeeForm({ values = {} }: { values?: V }) {
  return (
    <ActionForm action={saveEmployee} className="grid max-w-3xl gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <Field label="Ism *"><input name="name" required defaultValue={values.name} className={inputCls} /></Field>
      <Field label="Email (login) *"><input name="email" type="email" required defaultValue={values.email} className={inputCls} /></Field>
      <Field label="Telefon"><input name="phone" defaultValue={values.phone ?? ""} className={inputCls} /></Field>
      <Field label="Rol">
        <select name="role" defaultValue={values.role ?? "MANAGER"} className={inputCls}>
          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
        </select>
      </Field>
      <Field label={values.id ? "Yangi parol (o'zgartirish uchun)" : "Parol *"} hint="Kamida 10 belgi"><input name="password" type="password" autoComplete="new-password" className={inputCls} /></Field>
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={values.isActive ?? true} /> Faol (tizimga kira oladi)</label>
      <div className="sm:col-span-2"><Submit>Saqlash</Submit></div>
    </ActionForm>
  );
}
