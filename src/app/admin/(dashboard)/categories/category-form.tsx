"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCategory,
  updateCategory,
  type CategoryInput,
} from "./actions";

type CategoryFormProps = {
  categoryId?: string;
  initialValues?: Partial<CategoryInput>;
};

export function CategoryForm({ categoryId, initialValues }: CategoryFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialValues?.name ?? "");
  const [icon, setIcon] = useState(initialValues?.icon ?? "");
  const [sortOrder, setSortOrder] = useState(
    initialValues?.sortOrder !== undefined ? String(initialValues.sortOrder) : "0"
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

    if (!name.trim()) {
      setError("Kategoriya nomini kiriting.");
      return;
    }

    const input: CategoryInput = {
      name: name.trim(),
      icon,
      imageUrl,
      sortOrder: Number(sortOrder) || 0,
    };

    setSubmitting(true);
    const result = categoryId
      ? await updateCategory(categoryId, input)
      : await createCategory(input);
    setSubmitting(false);

    if (result && !result.ok) {
      setError(result.error);
    } else {
      router.push("/admin/categories");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Kategoriya nomi
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Ikonka (emoji)
        </label>
        <input
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="🏗️"
          className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Tartib raqami
        </label>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Kategoriya rasmi
        </label>
        <div className="flex items-center gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="Kategoriya rasmi"
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <span className="text-3xl">🖼️</span>
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
          onClick={() => router.push("/admin/categories")}
          className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Bekor qilish
        </button>
      </div>
    </form>
  );
}
