"use client";

import { parseSpecRows, specText } from "@/lib/product-specs";
import { useState } from "react";
import { ActionForm, Submit } from "@/components/admin/forms";
import { Field, inputCls, btn } from "@/components/admin/ui";
import type { ActionState } from "@/lib/admin-types";
import { UNIT_LABEL } from "@/lib/labels";

export type ProductFormValues = {
  id?: string;
  slug?: string;
  name?: string;
  nameRu?: string | null;
  nameEn?: string | null;
  description?: string;
  descriptionRu?: string | null;
  descriptionEn?: string | null;
  brand?: string | null;
  sku?: string | null;
  barcode?: string | null;
  compatibleWith?: string | null;
  unit?: string;
  price?: number;
  oldPrice?: number | null;
  costPrice?: number | null;
  imageUrl?: string | null;
  images?: string[];
  warrantyMonths?: number | null;
  freeDelivery?: boolean;
  minimumStock?: number;
  reorderPoint?: number | null;
  reorderQuantity?: number | null;
  weightKg?: number | null;
  capacityKg?: number | null;
  liftHeightMm?: number | null;
  workingWidthMm?: number | null;
  powerKw?: number | null;
  specs?: unknown;
  datasheetUrl?: string | null;
  videoUrl?: string | null;
  leadTimeDays?: number | null;
  isActive?: boolean;
  isFeatured?: boolean;
  categoryId?: string;
};

type Option = { id: string; name: string };

async function upload(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Yuklashda xatolik");
  return data.url;
}

export function ProductForm({
  action,
  values = {},
  categories,
  warehouses,
  canSeeCost,
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  values?: ProductFormValues;
  categories: Option[];
  warehouses?: Option[];
  canSeeCost: boolean;
}) {
  const isNew = !values.id;
  const [imageUrl, setImageUrl] = useState(values.imageUrl ?? "");
  const [images, setImages] = useState((values.images ?? []).join("\n"));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [tab, setTab] = useState<"uz" | "ru" | "en">("uz");

  async function onFiles(files: FileList | null, main: boolean) {
    if (!files?.length) return;
    setUploading(true);
    setUploadError(null);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await upload(f));
      if (main) {
        setImageUrl(urls[0]);
        if (urls.length > 1) setImages((prev) => [prev, ...urls.slice(1)].filter(Boolean).join("\n"));
      } else {
        setImages((prev) => [prev, ...urls].filter(Boolean).join("\n"));
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }

  const langTab = (l: "uz" | "ru" | "en", label: string) => (
    <button type="button" onClick={() => setTab(l)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === l ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
      {label}
    </button>
  );

  return (
    <ActionForm action={action} className="grid gap-5 lg:grid-cols-[1fr_340px]">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <input type="hidden" name="images" value={images} />

      <div className="flex flex-col gap-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            {langTab("uz", "O'zbekcha *")}
            {langTab("ru", "Русский")}
            {langTab("en", "English")}
            <span className="ml-auto text-xs text-slate-400">Bo&apos;sh qolsa — o&apos;zbekcha matn ko&apos;rsatiladi</span>
          </div>
          <div className={tab === "uz" ? "flex flex-col gap-4" : "hidden"}>
            <Field label="Nomi (o'zbekcha)">
              <input name="name" required defaultValue={values.name} className={inputCls} maxLength={200} />
            </Field>
            <Field label="Tavsif (o'zbekcha)" hint="Qidiruv so'zlarini tabiiy matnda ishlating: masalan «PND quvur payvandlash apparati, stykovka».">
              <textarea name="description" rows={8} defaultValue={values.description} className={inputCls} />
            </Field>
          </div>
          <div className={tab === "ru" ? "flex flex-col gap-4" : "hidden"}>
            <Field label="Название (русский)">
              <input name="nameRu" defaultValue={values.nameRu ?? ""} className={inputCls} maxLength={200} />
            </Field>
            <Field label="Описание (русский)" hint="Например: «аппарат для стыковой сварки ПНД труб, пайка, утюг».">
              <textarea name="descriptionRu" rows={8} defaultValue={values.descriptionRu ?? ""} className={inputCls} />
            </Field>
          </div>
          <div className={tab === "en" ? "flex flex-col gap-4" : "hidden"}>
            <Field label="Name (English)">
              <input name="nameEn" defaultValue={values.nameEn ?? ""} className={inputCls} maxLength={200} />
            </Field>
            <Field label="Description (English)">
              <textarea name="descriptionEn" rows={8} defaultValue={values.descriptionEn ?? ""} className={inputCls} />
            </Field>
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-3">
          <Field label="Narx (so'm, QQS bilan) *">
            <input name="price" required inputMode="numeric" defaultValue={values.price ?? ""} className={inputCls} />
          </Field>
          <Field label="Eski narx (chegirma)" hint="Ixtiyoriy">
            <input name="oldPrice" inputMode="numeric" defaultValue={values.oldPrice ?? ""} className={inputCls} />
          </Field>
          {canSeeCost ? (
            <Field label="Tannarx (so'm)" hint="Saytda ko'rinmaydi — marja uchun">
              <input name="costPrice" inputMode="numeric" defaultValue={values.costPrice ?? ""} className={inputCls} />
            </Field>
          ) : (
            <input type="hidden" name="costPrice" value={values.costPrice ?? ""} />
          )}
          <Field label="Model / SKU">
            <input name="sku" defaultValue={values.sku ?? ""} className={inputCls} />
          </Field>
          <Field label="Brend">
            <input name="brand" defaultValue={values.brand ?? ""} className={inputCls} />
          </Field>
          <Field label="Shtrix-kod">
            <input name="barcode" defaultValue={values.barcode ?? ""} className={inputCls} />
          </Field>
          <Field label="Mos keladigan modellar (ehtiyot qism uchun)" hint="Vergul bilan: CBY-AC, CTQB 1.5T, BS3500">
            <input name="compatibleWith" defaultValue={values.compatibleWith ?? ""} className={inputCls} />
          </Field>
          <Field label="Kafolat (oy)" hint="Bo'sh — ko'rsatilmaydi">
            <input name="warrantyMonths" inputMode="numeric" defaultValue={values.warrantyMonths ?? ""} className={inputCls} />
          </Field>
          <Field label="O'lchov birligi">
            <select name="unit" defaultValue={values.unit ?? "PIECE"} className={inputCls}>
              {Object.entries(UNIT_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Og'irlik (kg)">
            <input name="weightKg" inputMode="decimal" defaultValue={values.weightKg ?? ""} className={inputCls} />
          </Field>
        </section>

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-4">
          <h2 className="font-semibold text-slate-800 sm:col-span-4">
            Texnik xususiyatlar <span className="text-sm font-normal text-slate-400">— katalog filtrlari va mahsulot sahifasidagi jadval</span>
          </h2>
          <Field label="Yuk ko'tarish (kg)">
            <input name="capacityKg" inputMode="decimal" defaultValue={values.capacityKg ?? ""} className={inputCls} />
          </Field>
          <Field label="Ko'tarish balandligi (mm)">
            <input name="liftHeightMm" inputMode="numeric" defaultValue={values.liftHeightMm ?? ""} className={inputCls} />
          </Field>
          <Field label="Ishchi kenglik (mm)">
            <input name="workingWidthMm" inputMode="numeric" defaultValue={values.workingWidthMm ?? ""} className={inputCls} />
          </Field>
          <Field label="Quvvat (kVt)">
            <input name="powerKw" inputMode="decimal" defaultValue={values.powerKw ?? ""} className={inputCls} />
          </Field>
          <div className="sm:col-span-4">
            <Field label="Qo'shimcha xususiyatlar" hint="Har qatorda bitta: O'zbekcha nomi | Ruscha nomi | qiymat. Masalan: Akkumulyator | Аккумулятор | 24 V 100 Ah">
              <textarea name="specs" rows={5} defaultValue={specText(parseSpecRows(values.specs))} className={`${inputCls} font-mono text-xs`} />
            </Field>
          </div>
          <Field label="Texnik pasport (PDF havola)">
            <input name="datasheetUrl" placeholder="https://… yoki /uploads/…" defaultValue={values.datasheetUrl ?? ""} className={inputCls} />
          </Field>
          <Field label="Video (YouTube havola)">
            <input name="videoUrl" placeholder="https://youtu.be/…" defaultValue={values.videoUrl ?? ""} className={inputCls} />
          </Field>
          <Field label="Yetkazish muddati (kun)" hint="Omborda yo'q bo'lsa ko'rsatiladi">
            <input name="leadTimeDays" inputMode="numeric" defaultValue={values.leadTimeDays ?? ""} className={inputCls} />
          </Field>
        </section>

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-3">
          <Field label="Minimal qoldiq" hint="Shundan past — «kam qoldi»">
            <input name="minimumStock" inputMode="numeric" defaultValue={values.minimumStock ?? 0} className={inputCls} />
          </Field>
          <Field label="Qayta buyurtma nuqtasi">
            <input name="reorderPoint" inputMode="numeric" defaultValue={values.reorderPoint ?? ""} className={inputCls} />
          </Field>
          <Field label="Tavsiya buyurtma miqdori">
            <input name="reorderQuantity" inputMode="numeric" defaultValue={values.reorderQuantity ?? ""} className={inputCls} />
          </Field>
          {isNew && warehouses && warehouses.length > 0 && (
            <>
              <Field label="Boshlang'ich qoldiq">
                <input name="openingStock" inputMode="numeric" defaultValue={0} className={inputCls} />
              </Field>
              <Field label="Qaysi omborga">
                <select name="warehouseId" className={inputCls}>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}
        </section>
      </div>

      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <Field label="Kategoriya *">
            <select name="categoryId" required defaultValue={values.categoryId ?? ""} className={inputCls}>
              <option value="" disabled>
                — tanlang —
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Slug (URL)" hint={isNew ? "Bo'sh qolsa nomdan yaratiladi" : "O'zgartirsangiz eski havola ishlamay qoladi"}>
            <input name="slug" defaultValue={values.slug ?? ""} className={inputCls} pattern="[a-z0-9-]*" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={values.isActive ?? true} /> Faol (saytda ko&apos;rinadi)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isFeatured" defaultChecked={values.isFeatured ?? false} /> Tavsiya etilgan (bosh sahifada)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="freeDelivery" defaultChecked={values.freeDelivery ?? false} /> Bepul yetkazib berish
          </label>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-700">Asosiy rasm</p>
          <div className="flex aspect-square items-center justify-center rounded-xl bg-slate-50 p-4">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="text-4xl">📦</span>
            )}
          </div>
          <label className={`${btn("secondary", "sm")} cursor-pointer`}>
            {uploading ? "Yuklanmoqda..." : "Rasm yuklash"}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/avif" multiple className="hidden" onChange={(e) => onFiles(e.target.files, true)} />
          </label>
          {imageUrl && (
            <button type="button" onClick={() => setImageUrl("")} className="text-xs text-red-500">
              Rasmni olib tashlash
            </button>
          )}
          <Field label="Qo'shimcha rasmlar (har qatorda bitta URL)">
            <textarea value={images} onChange={(e) => setImages(e.target.value)} rows={3} className={`${inputCls} font-mono text-xs`} />
          </Field>
          <label className={`${btn("secondary", "sm")} cursor-pointer`}>
            + Qo&apos;shimcha rasm
            <input type="file" accept="image/png,image/jpeg,image/webp,image/avif" multiple className="hidden" onChange={(e) => onFiles(e.target.files, false)} />
          </label>
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
        </section>

        <Submit>{isNew ? "Mahsulotni yaratish" : "Saqlash"}</Submit>
      </div>
    </ActionForm>
  );
}
