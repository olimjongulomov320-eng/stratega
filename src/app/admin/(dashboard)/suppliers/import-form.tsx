"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type RowResult =
  | { status: "created"; name: string }
  | { status: "updated"; name: string }
  | { status: "skipped"; name: string; reason: string };

type ImportResponse =
  | { created: RowResult[]; updated: RowResult[]; skipped: RowResult[] }
  | { error: string };

export function SupplierImportForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/suppliers/import", {
        method: "POST",
        body: formData,
      });
      const data: ImportResponse = await res.json();
      setResult(data);
      if (!("error" in data)) {
        router.refresh();
      }
    } catch {
      setResult({ error: "Yuklashda xatolik yuz berdi." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-slate-900">CSV import</h2>
      <p className="mt-1 text-xs text-slate-400">
        Ustunlar: nomi,telefon,email,manzil
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          disabled={uploading}
          className="text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100"
        />
        <button
          type="submit"
          disabled={uploading}
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "Yuklanmoqda..." : "Yuklash"}
        </button>
      </form>

      {result && "error" in result && (
        <p className="mt-4 text-sm text-rose-600">{result.error}</p>
      )}

      {result && !("error" in result) && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            Yaratildi: {result.created.length}
          </span>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
            Yangilandi: {result.updated.length}
          </span>
          {result.skipped.length > 0 && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
              O&apos;tkazib yuborildi: {result.skipped.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
