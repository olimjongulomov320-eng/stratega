"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { COMPANY } from "@/lib/site";
import { submitQuickOrder } from "@/app/[locale]/actions";
import { trackGoal } from "@/lib/web-analytics";

/** "Request a call" (no product) or "Buy in 1 click" (with productId): a small dialog asking for name and phone. */
export function QuickOrder({ productId, productName, className, label }: { productId?: string; productName?: string; className?: string; label?: string }) {
  const { t, locale } = useI18n();
  const q = t.quickOrder;
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onClose = () => {
      setState((s) => (s === "done" ? "idle" : s));
      setError(null);
    };
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("sending");
    let result: Awaited<ReturnType<typeof submitQuickOrder>>;
    try {
      result = await submitQuickOrder({ name, phone, productId }, locale);
    } catch {
      setError(fmt(t.common.sendFailed, { phone: COMPANY.phone }));
      setState("idle");
      return;
    }
    if (!result.ok) {
      setError(result.error);
      setState("idle");
      return;
    }
    trackGoal(productId ? "one_click_sent" : "callback_sent");
    setState("done");
  }

  const input = "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 outline-none focus:border-indigo-400";
  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className={className}>
        {label ?? (productId ? q.oneClick : q.callback)}
      </button>
      <dialog ref={dialog} className="m-auto w-[min(92vw,26rem)] rounded-2xl p-0 backdrop:bg-slate-900/50">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">{productId ? q.oneClickTitle : q.callbackTitle}</h2>
            <button type="button" onClick={() => dialog.current?.close()} aria-label={q.close} className="text-slate-400 hover:text-slate-700">
              ✕
            </button>
          </div>
          {productName && <p className="mt-1 text-sm font-medium text-indigo-700">{productName}</p>}
          {state === "done" ? (
            <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
              {q.done}
            </p>
          ) : (
            <form onSubmit={submit} className="mt-3 flex flex-col gap-3">
              <p className="text-sm text-slate-500">{productId ? q.oneClickText : q.callbackText}</p>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={160} placeholder={q.name} autoComplete="name" className={input} />
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={30}
                placeholder={q.phone}
                autoComplete="tel"
                className={input}
              />
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={state === "sending"} className="rounded-full bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-300">
                {state === "sending" ? q.sending : q.send}
              </button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
