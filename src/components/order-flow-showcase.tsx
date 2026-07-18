"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { icon: "🔍", label: "Katalogdan tanlash", desc: "Kerakli texnikani katalogdan tanlaysiz" },
  { icon: "📋", label: "Spetsifikatsiya", desc: "So'rovingizni menejerga yuborasiz" },
  { icon: "🧾", label: "Hisob-faktura", desc: "NDS bilan hujjatlar tayyorlanadi" },
  { icon: "🚚", label: "Yetkazib berish", desc: "Ob'ektga yoki ombordan olib ketasiz" },
  { icon: "🛠️", label: "Kafolat xizmati", desc: "O'rnatish va servis yordami" },
];

export function OrderFlowShowcase() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((v) => (v + 1) % STEPS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #dc2626 0, transparent 45%), radial-gradient(circle at 80% 80%, #dc2626 0, transparent 45%)",
          }}
        />
        <div className="relative">
          <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Jarayon
          </span>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Buyurtma qanday amalga oshadi
          </h2>
          <p className="mt-3 max-w-xl text-slate-600">
            Tanlovdan yetkazib berishgacha — har bir bosqichda shaxsiy
            menejer siz bilan aloqada bo&apos;ladi.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-5">
            {STEPS.map((step, i) => {
              const isActive = i === active;
              const isDone = i < active;
              return (
                <div
                  key={step.label}
                  className="flex flex-col items-center text-center"
                >
                  <span
                    className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-sm transition-all duration-500 ${
                      isActive
                        ? "scale-110 bg-indigo-600 text-white shadow-indigo-300"
                        : isDone
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-white text-slate-400"
                    }`}
                  >
                    {step.icon}
                  </span>
                  <p
                    className={`mt-3 text-sm font-semibold transition-colors duration-300 ${
                      isActive ? "text-indigo-700" : "text-slate-700"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{step.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center gap-1.5">
            {STEPS.map((step, i) => (
              <button
                key={step.label}
                onClick={() => setActive(i)}
                aria-label={`${i + 1}-bosqich`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active ? "w-6 bg-indigo-600" : "w-1.5 bg-slate-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
