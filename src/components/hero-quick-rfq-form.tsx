"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { submitQuickRfq } from "@/app/[locale]/(site)/rfq-hero-actions";

export function HeroQuickRfqForm() {
  const t = useTranslations("heroRfq");
  const tRequestTypes = useTranslations("requestTypes");
  const tCommon = useTranslations("common");
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

    const result = await submitQuickRfq({
      companyName,
      phone,
      requestType,
      description,
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(t("errorRequiredFields"));
      return;
    }

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
          {t("successHeading")}
        </h3>
        <p className="mt-1 text-sm text-slate-300">
          {t("successDescription")}
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-4 text-sm font-medium text-indigo-300 hover:text-indigo-200"
        >
          {t("sendAnother")}
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
        <h3 className="font-semibold">{t("formHeading")}</h3>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("companyNameLabel")}
          </label>
          <input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={t("companyNamePlaceholder")}
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-400 focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("phoneLabel")}
          </label>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("phonePlaceholder")}
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-400 focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("requestTypeLabel")}
          </label>
          <input
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            placeholder={tRequestTypes("objectComplectation")}
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-400 focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("descriptionLabel")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={t("descriptionPlaceholder")}
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-400 focus:border-indigo-400"
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? tCommon("sending") : tCommon("getQuote")}
        </button>
        <p className="text-center text-xs text-slate-400">{t("finePrint")}</p>
      </div>
    </form>
  );
}
