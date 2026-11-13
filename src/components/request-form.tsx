"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { COMPANY } from "@/lib/site";
import { submitQuickRfq } from "@/app/[locale]/actions";
import { trackGoal } from "@/lib/web-analytics";

type Text = { name: string; phone: string; extra: string; extraPlaceholder: string; message: string; messagePlaceholder: string; send: string; sending: string; done: string; requestType: string };

/** Short request form (dealer, service): goes to the same request inbox and Telegram alert as the home page form. */
export function RequestForm({ text }: { text: Text }) {
  const { t, locale } = useI18n();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [extra, setExtra] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const input = "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 outline-none focus:border-indigo-400";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("sending");
    const description = [extra.trim() && `${text.extra}: ${extra.trim()}`, message.trim()].filter(Boolean).join("\n");
    try {
      const result = await submitQuickRfq({ companyName: name, phone, requestType: text.requestType, description }, locale);
      if (!result.ok) {
        setError(result.error);
        setState("idle");
        return;
      }
    } catch {
      setError(fmt(t.common.sendFailed, { phone: COMPANY.phone }));
      setState("idle");
      return;
    }
    trackGoal("quick_rfq_sent");
    setState("done");
  }

  if (state === "done") return <p className="rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700" role="status">{text.done}</p>;
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium text-slate-600">
        {text.name} *
        <input required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} autoComplete="organization" className={`${input} mt-1`} />
      </label>
      <label className="text-sm font-medium text-slate-600">
        {text.phone} *
        <input required type="tel" maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className={`${input} mt-1`} />
      </label>
      <label className="text-sm font-medium text-slate-600 sm:col-span-2">
        {text.extra}
        <input maxLength={200} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder={text.extraPlaceholder} className={`${input} mt-1`} />
      </label>
      <label className="text-sm font-medium text-slate-600 sm:col-span-2">
        {text.message}
        <textarea rows={3} maxLength={2500} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={text.messagePlaceholder} className={`${input} mt-1`} />
      </label>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-2">{error}</p>}
      <button type="submit" disabled={state === "sending"} className="rounded-full bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-300 sm:col-span-2">
        {state === "sending" ? text.sending : text.send}
      </button>
    </form>
  );
}
