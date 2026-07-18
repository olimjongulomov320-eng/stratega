"use client";

import { useState } from "react";
import { submitQuickRfq } from "@/app/(site)/rfq-hero-actions";

export function HeroQuickRfqForm() {
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
      setError(result.error);
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
          So&apos;rovingiz qabul qilindi!
        </h3>
        <p className="mt-1 text-sm text-slate-300">
          Menejerimiz 30 daqiqa ichida siz bilan bog&apos;lanadi.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-4 text-sm font-medium text-indigo-300 hover:text-indigo-200"
        >
          Yana so&apos;rov yuborish
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
          Tezkor kommertsiya taklifi so&apos;rovi
        </h3>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Kompaniya nomi
          </label>
          <input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="OOO «Sizning kompaniyangiz»"
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-400 focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Telefon raqamingiz
          </label>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998"
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-400 focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            So&apos;rov turi
          </label>
          <input
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            placeholder="Ob'ekt komplektatsiyasi"
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-400 focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tavsif / spetsifikatsiya
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Qisqacha nima kerakligini yozing..."
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-400 focus:border-indigo-400"
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? "Yuborilmoqda..."
            : "Kommertsiya taklifini olish →"}
        </button>
        <p className="text-center text-xs text-slate-400">
          Menejer ish vaqtida 30 daqiqa ichida bog&apos;lanadi
        </p>
      </div>
    </form>
  );
}
