"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ImportRowResult =
  | { status: "updated"; slug: string; stillHidden: boolean }
  | { status: "skipped"; slug: string; reason: string };

type ImportResponse =
  | { updated: ImportRowResult[]; skipped: ImportRowResult[] }
  | { error: string };

export function ImportForm() {
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
      const res = await fetch("/api/admin/products/import", {
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
    <div className="mt-5">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
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
        <div className="mt-5 flex flex-col gap-3">
          <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            Yangilandi: {result.updated.length}
          </span>

          {result.updated.some(
            (r) => r.status === "updated" && r.stillHidden
          ) && (
            <p className="text-xs text-amber-600">
              Ba&apos;zi mahsulotlar qoldiq qo&apos;shilgandan keyin ham
              nofaol bo&apos;lib qoldi — ularni qo&apos;lda faollashtiring.
            </p>
          )}

          {result.skipped.length > 0 && (
            <div>
              <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                O&apos;tkazib yuborildi: {result.skipped.length}
              </span>
              <ul className="mt-2 flex flex-col gap-1 text-xs text-slate-500">
                {result.skipped.map((r, i) =>
                  r.status === "skipped" ? (
                    <li key={i}>
                      slug &quot;{r.slug}&quot; — {r.reason}
                    </li>
                  ) : null
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
