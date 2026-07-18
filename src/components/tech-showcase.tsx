"use client";

import { useState } from "react";

const STEPS = [
  { icon: "⚡", label: "Quvvat manbai" },
  { icon: "⚙️", label: "Gidronasos" },
  { icon: "🔧", label: "Boshqaruv bloki" },
  { icon: "🔩", label: "Silindr" },
  { icon: "🏗️", label: "Ish organi" },
];

export function TechShowcase() {
  const [withPump, setWithPump] = useState(true);

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="grid gap-10 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:grid-cols-2 md:p-10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Texnologiya
          </span>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Gidravlik tizim qanday ishlaydi
          </h2>
          <p className="mt-3 text-slate-600">
            To&apos;g&apos;ri tanlangan gidravlik uskunalar energiya sarfini
            kamaytiradi va texnika xizmat muddatini uzaytiradi.
          </p>

          <div className="mt-5 inline-flex rounded-full border border-slate-200 bg-white p-1">
            <button
              onClick={() => setWithPump(false)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                !withPump
                  ? "bg-slate-800 text-white"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Nasozsiz
            </button>
            <button
              onClick={() => setWithPump(true)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                withPump
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Gidronasos bilan
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
              <p className="text-xl font-bold text-emerald-700">
                {withPump ? "−30%" : "0%"}
              </p>
              <p className="text-xs text-emerald-700/70">Energiya sarfi</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
              <p className="text-xl font-bold text-emerald-700">
                {withPump ? "+40%" : "0%"}
              </p>
              <p className="text-xs text-emerald-700/70">Xizmat muddati</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
              <p className="text-xl font-bold text-emerald-700">
                {withPump ? "+25%" : "0%"}
              </p>
              <p className="text-xs text-emerald-700/70">Tizim FIK</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="-mx-6 flex items-center gap-0 overflow-x-auto px-6 sm:mx-0 sm:justify-between sm:px-0">
            {STEPS.map((step, i) => (
              <div key={step.label} className="flex shrink-0 items-center">
                <div className="flex w-16 flex-col items-center gap-1.5">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl transition ${
                      withPump
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {step.icon}
                  </span>
                  <span className="max-w-[4.5rem] text-center text-[11px] text-slate-500">
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <span
                    className={`mx-1 h-0.5 w-4 shrink-0 transition sm:w-8 ${
                      withPump ? "bg-indigo-300" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div
            className={`rounded-xl border px-4 py-3 text-sm transition ${
              withPump
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            {withPump
              ? "✓ Tizim barqaror bosim bilan samarali ishlamoqda"
              : "Tizim bosimi nazoratsiz — uskunaga ortiqcha yuk tushishi mumkin"}
          </div>
        </div>
      </div>
    </section>
  );
}
