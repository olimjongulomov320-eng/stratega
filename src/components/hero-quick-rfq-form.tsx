"use client";

import { useState } from "react";
import { submitQuickRfq } from "@/app/[locale]/actions";
import { trackGoal } from "@/lib/web-analytics";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { COMPANY } from "@/lib/site";

export function HeroQuickRfqForm() {
  const { t, locale } = useI18n();
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [requestType, setRequestType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    let result: Awaited<ReturnType<typeof submitQuickRfq>>;
    try {
      result = await submitQuickRfq({ companyName, phone, requestType, description }, locale);
    } catch {
      setError(fmt(t.common.sendFailed, { phone: COMPANY.phone }));
      return;
    } finally {
      setSubmitting(false);
    }

    if (!result.ok) {
      setError(result.error);
      return;
    }

    trackGoal("quick_rfq_sent");
    setSent(true);
    setCompanyName("");
    setPhone("");
    setRequestType("");
    setDescription("");
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-2xl">
          ✓
        </div>
        <h3 className="mt-4 text-lg font-bold text-white">
          {t.quickRfq.successTitle}
        </h3>
        <p className="mt-1 text-sm text-slate-300">
          {t.quickRfq.successText}
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-4 text-sm font-medium text-indigo-300 hover:text-indigo-200"
        >
          {t.quickRfq.again}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-fade-in-up rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
    >
      <div className="flex items-center gap-2 text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-lg">
          💬
        </span>
        <h3 className="font-semibold">
          {t.quickRfq.title}
        </h3>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <div>
          <label htmlFor="qrfq-company" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t.quickRfq.company}
          </label>
          <input
            required
            id="qrfq-company"
            autoComplete="organization"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={t.quickRfq.companyPlaceholder}
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-400 focus:border-indigo-400"
          />
        </div>
        <div>
          <label htmlFor="qrfq-phone" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t.quickRfq.phone}
          </label>
          <input
            required
            type="tel"
            id="qrfq-phone"
            autoComplete="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998"
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-400 focus:border-indigo-400"
          />
        </div>
        <div>
          <label htmlFor="qrfq-type" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t.quickRfq.type}
          </label>
          <input
            id="qrfq-type"
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            placeholder={t.quickRfq.typePlaceholder}
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-400 focus:border-indigo-400"
          />
        </div>
        <div>
          <label htmlFor="qrfq-desc" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t.quickRfq.description}
          </label>
          <textarea
            id="qrfq-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={t.quickRfq.descriptionPlaceholder}
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-400 focus:border-indigo-400"
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? t.common.sending : t.quickRfq.submit}
        </button>
        <p className="text-center text-xs text-slate-400">
          {t.quickRfq.note}
        </p>
      </div>
    </form>
  );
}
