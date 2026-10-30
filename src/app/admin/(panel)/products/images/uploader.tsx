"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = { file: string; status: "waiting" | "uploading" | "ok" | "error"; message?: string };

export default function BulkImageUploader() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f.name));
    setRows(list.map((f) => ({ file: f.name, status: "waiting" })));
    setBusy(true);
    const update = (i: number, patch: Partial<Row>) => setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    // Three uploads at a time: fast enough, gentle on the server.
    let next = 0;
    async function worker() {
      while (next < list.length) {
        const i = next++;
        update(i, { status: "uploading" });
        const body = new FormData();
        body.append("file", list[i]);
        try {
          const res = await fetch("/api/admin/product-image", { method: "POST", body });
          const data = await res.json().catch(() => ({}));
          if (res.ok) update(i, { status: "ok", message: `${data.sku ?? ""} — ${data.as === "extra" ? "qo'shimcha rasm" : "asosiy rasm"}` });
          else update(i, { status: "error", message: data.error ?? `Xatolik ${res.status}` });
        } catch {
          update(i, { status: "error", message: "Tarmoq xatoligi" });
        }
      }
    }
    await Promise.all([worker(), worker(), worker()]);
    setBusy(false);
    router.refresh();
  }

  const done = rows.filter((r) => r.status === "ok").length;
  const failed = rows.filter((r) => r.status === "error").length;

  return (
    <div>
      <label className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-10 text-center hover:border-indigo-400 ${busy ? "pointer-events-none opacity-60" : ""}`}>
        <span className="text-sm font-medium text-slate-700">Rasmlarni tanlang yoki shu yerga tashlang</span>
        <span className="mt-1 text-xs text-slate-400">Bir nechta faylni birdaniga tanlash mumkin</span>
        <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/avif" className="sr-only" onChange={(e) => upload(e.target.files)} />
      </label>
      {rows.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-slate-700">
            Yuklandi: <b className="text-emerald-600">{done}</b> · Xato: <b className="text-rose-600">{failed}</b> · Jami: {rows.length}
            {busy && " · yuklanmoqda…"}
          </p>
          <ul className="mt-2 max-h-80 overflow-auto rounded-lg border border-slate-100 text-sm">
            {rows.map((r, i) => (
              <li key={i} className="flex justify-between gap-3 border-b border-slate-50 px-3 py-1.5">
                <span className="font-mono text-xs text-slate-700">{r.file}</span>
                <span className={r.status === "ok" ? "text-emerald-600" : r.status === "error" ? "text-rose-600" : "text-slate-400"}>
                  {r.status === "waiting" ? "kutilmoqda" : r.status === "uploading" ? "yuklanmoqda…" : r.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
