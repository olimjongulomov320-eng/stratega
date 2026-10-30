import { ActionForm, Submit } from "@/components/admin/forms";
import { Field, inputCls } from "@/components/admin/ui";
import { saveCategory } from "./actions";

type V = {
  id?: string; slug?: string; name?: string; nameRu?: string | null; nameEn?: string | null; description?: string | null;
  descriptionRu?: string | null; descriptionEn?: string | null; icon?: string | null; imageUrl?: string | null; sortOrder?: number; isActive?: boolean; isSparePart?: boolean; olxCategory?: string | null;
};

export function CategoryForm({ values = {} }: { values?: V }) {
  return (
    <ActionForm action={saveCategory} className="grid max-w-4xl gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-3">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <Field label="Nomi (o'zbekcha) *"><input name="name" required defaultValue={values.name} className={inputCls} /></Field>
      <Field label="Название (русский)"><input name="nameRu" defaultValue={values.nameRu ?? ""} className={inputCls} /></Field>
      <Field label="Name (English)"><input name="nameEn" defaultValue={values.nameEn ?? ""} className={inputCls} /></Field>
      <Field label="SEO matn (o'zbekcha)" hint="Kategoriya sahifasida va Google tavsifida" className="sm:col-span-3">
        <textarea name="description" rows={3} defaultValue={values.description ?? ""} className={inputCls} />
      </Field>
      <Field label="SEO текст (русский)" className="sm:col-span-3">
        <textarea name="descriptionRu" rows={3} defaultValue={values.descriptionRu ?? ""} className={inputCls} />
      </Field>
      <Field label="SEO text (English)" className="sm:col-span-3">
        <textarea name="descriptionEn" rows={3} defaultValue={values.descriptionEn ?? ""} className={inputCls} />
      </Field>
      <Field label="Ikonka (emoji)"><input name="icon" defaultValue={values.icon ?? ""} className={inputCls} /></Field>
      <Field label="Tartib raqami"><input name="sortOrder" inputMode="numeric" defaultValue={values.sortOrder ?? 0} className={inputCls} /></Field>
      <Field label="Slug (URL)" hint={values.id ? "O'zgartirsangiz eski havola ishlamaydi" : "Bo'sh — nomdan"}><input name="slug" defaultValue={values.slug ?? ""} className={inputCls} /></Field>
      <Field label="Rasm URL (ixtiyoriy)" className="sm:col-span-2"><input name="imageUrl" defaultValue={values.imageUrl ?? ""} className={inputCls} /></Field>
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={values.isActive ?? true} /> Faol</label>
      <label className="flex items-start gap-2 text-sm sm:col-span-3">
        <input type="checkbox" name="isSparePart" defaultChecked={values.isSparePart ?? false} className="mt-0.5" />
        <span>Ehtiyot qismlar kategoriyasi <span className="block text-xs text-slate-500">Saytda asosiy menyuda emas, «Ehtiyot qismlar» bo&apos;limida ko&apos;rinadi.</span></span>
      </label>
      <Field label="OLX kategoriyasi" hint="OLX eksport faylida ishlatiladi, masalan: Бизнес и услуги / Оборудование" className="sm:col-span-3">
        <input name="olxCategory" defaultValue={values.olxCategory ?? ""} className={inputCls} />
      </Field>
      <div className="sm:col-span-3"><Submit>Saqlash</Submit></div>
    </ActionForm>
  );
}
