"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct, type ProductInput } from "./actions";

type CategoryOption = { id: string; name: string };

type ProductFormProps = {
  categories: CategoryOption[];
  productId?: string;
  initialValues?: Partial<ProductInput>;
};

export function ProductForm({
  categories,
  productId,
  initialValues,
}: ProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  );
  const [price, setPrice] = useState(
    initialValues?.price ? String(initialValues.price) : ""
  );
  const [oldPrice, setOldPrice] = useState(
    initialValues?.oldPrice ? String(initialValues.oldPrice) : ""
  );
  const [categoryId, setCategoryId] = useState(
    initialValues?.categoryId ?? categories[0]?.id ?? ""
  );
  const [stock, setStock] = useState(
    initialValues?.stock !== undefined ? String(initialValues.stock) : "0"
  );
  const [isActive, setIsActive] = useState(initialValues?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(
    initialValues?.isFeatured ?? false
  );
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialValues?.imageUrl ?? null
  );

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Yuklashda xatolik yuz berdi.");
        return;
      }
      setImageUrl(data.url);
    } catch {
      setError("Yuklashda xatolik yuz berdi.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const priceNum = Number(price);
    const oldPriceNum = oldPrice.trim() ? Number(oldPrice) : null;
    const stockNum = Number(stock) || 0;

    if (!name.trim()) {
      setError("Mahsulot nomini kiriting.");
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError("Narxni to'g'ri kiriting.");
      return;
    }

    const input: ProductInput = {
      name: name.trim(),
      description: description.trim(),
      price: priceNum,
      oldPrice: oldPriceNum,
      imageUrl,
      categoryId,
      stock: stockNum,
      isActive,
      isFeatured,
    };

    setSubmitting(true);
    const result = productId
      ? await updateProduct(productId, input)
      : await createProduct(input);
    setSubmitting(false);

    if (result && !result.ok) {
      setError(result.error);
    } else {
      router.push("/admin/products");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Mahsulot nomi
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Tavsif
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Narx (so&apos;m)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Eski narx (chegirma uchun, ixtiyoriy)
          </label>
          <input
            type="number"
            value={oldPrice}
            onChange={(e) => setOldPrice(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Kategoriya
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Ombordagi soni
          </label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Mahsulot rasmi
          </label>
          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Mahsulot rasmi"
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <span className="text-3xl">📦</span>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100"
              />
              {uploading && (
                <p className="mt-1 text-xs text-slate-400">Yuklanmoqda...</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          <label htmlFor="isActive" className="text-sm text-slate-700">
            Faol (saytda ko&apos;rinadi)
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isFeatured"
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          <label htmlFor="isFeatured" className="text-sm text-slate-700">
            Tavsiya etilgan
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saqlanmoqda..." : "Saqlash"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Bekor qilish
        </button>
      </div>
    </form>
  );
}
