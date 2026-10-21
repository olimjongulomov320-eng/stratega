"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PlannedRow = {
  row: number;
  slug: string;
  action: "update" | "skip";
  reason?: string;
  changes: { field: string; from: string | number; to: string | number }[];
};

type PreviewResponse = {
  preview: { rows: PlannedRow[]; toUpdate: number; toSkip: number };
} | { error: string };

type ApplyResponse =
  | {
      updated: { status: string; slug: string }[];
      skipped: { status: string; slug: string; reason?: string }[];
    }
  | { error: string };

// Ikki bosqichli CSV import: 1) tahlil (preview) — hech narsa o'zgarmaydi,
// 2) tasdiq — faqat ko'rsatilgan o'zgarishlar amalga oshiriladi.
export function ImportForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"pick" | "preview" | "done">("pick");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [result, setResult] = useState<ApplyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  async function upload(previewMode: boolean): Promise<ApplyResponse | PreviewResponse | null> {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Avval CSV faylni tanlang.");
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (previewMode) formData.append("preview", "true");
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      return data;
    } catch {
      setError("Yuklashda xatolik yuz berdi.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Avval CSV faylni tanlang.");
      return;
    }
    setFileName(file.name);
    setResult(null);
    const data = (await upload(true)) as PreviewResponse | null;
    if (!data) return;
    if ("error" in data) {
      setError(data.error);
      return;
    }
    setPreview(data);
    setStep("preview");
  }

  async function handleConfirm() {
    const data = (await upload(false)) as ApplyResponse | null;
    if (!data) return;
    if ("error" in data) {
      setError(data.error);
      return;
    }
    setResult(data);
    setPreview(null);
    setStep("done");
    router.refresh();
  }

  function handleReset() {
    setStep("pick");
    setPreview(null);
    setResult(null);
    setError(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="mt-5">
      {step === "pick" && (
        <form onSubmit={handleAnalyze} className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            disabled={loading}
            className="text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Tahlil qilinmoqda..." : "Faylni tahlil qilish"}
          </button>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

      {step === "preview" && preview && "preview" in preview && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {fileName} — oldindan ko&apos;rish
              </p>
              <p className="text-xs text-slate-500">
                Yangilanadi: {preview.preview.toUpdate} · O&apos;tkazib yuboriladi:{" "}
                {preview.preview.toSkip}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading || preview.preview.toUpdate === 0}
                className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Amalga oshirilmoqda..." : `Tasdiqlash (${preview.preview.toUpdate})`}
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Slug</th>
                  <th className="px-4 py-2">Amal</th>
                  <th className="px-4 py-2">O&apos;zgarishlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.preview.rows.map((row) => (
                  <tr key={`${row.row}-${row.slug}`}>
                    <td className="px-4 py-2 text-slate-400">{row.row}</td>
                    <td className="px-4 py-2 font-mono text-slate-700">{row.slug}</td>
                    <td className="px-4 py-2">
                      {row.action === "update" ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                          Yangilash
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                          O&apos;tkazish
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {row.action === "update"
                        ? row.changes
                            .map((c) => `${c.field}: ${c.from} → ${c.to}`)
                            .join(" · ")
                        : row.reason ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === "done" && result && !("error" in result) && (
        <div className="mt-5 flex flex-col gap-3">
          <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            Yangilandi: {result.updated.length}
          </span>
          {result.skipped.length > 0 && (
            <div>
              <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                O&apos;tkazib yuborildi: {result.skipped.length}
              </span>
              <ul className="mt-2 flex flex-col gap-1 text-xs text-slate-500">
                {result.skipped.map((r, i) => (
                  <li key={i}>
                    slug &quot;{r.slug}&quot;
                    {r.reason ? ` — ${r.reason}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="w-fit rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Yangi fayl yuklash
          </button>
        </div>
      )}
    </div>
  );
}
