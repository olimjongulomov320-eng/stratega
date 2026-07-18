"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendOtp, verifyOtp } from "./actions";
import { LogoMark } from "@/components/logo-mark";

export default function KirishPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/kabinet";

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("+998");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await sendOtp(phone);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDevCode(result.devCode ?? null);
    setStep("code");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await verifyOtp(phone, code);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="flex items-center gap-2 self-center">
        <LogoMark className="h-9 w-9" />
        <span className="text-xl font-black tracking-tight text-slate-900">
          STRATEG<span className="text-indigo-600">A</span>
        </span>
      </div>

      <h1 className="mt-8 text-center text-2xl font-bold text-slate-900">
        {step === "phone" ? "Shaxsiy kabinetga kirish" : "Kodni kiriting"}
      </h1>
      <p className="mt-1 text-center text-sm text-slate-500">
        {step === "phone"
          ? "Telefon raqamingizni kiriting, sizga tasdiqlash kodi yuboriladi"
          : `${phone} raqamiga yuborilgan kodni kiriting`}
      </p>

      {step === "phone" ? (
        <form onSubmit={handleSendOtp} className="mt-8 flex flex-col gap-4">
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 90 123 45 67"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg outline-none focus:border-indigo-400"
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? "Yuborilmoqda..." : "Kodni olish"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="mt-8 flex flex-col gap-4">
          {devCode && (
            <p className="rounded-lg bg-amber-50 px-4 py-2 text-center text-sm text-amber-700">
              Demo rejimi: SMS ulanmagan, kodingiz —{" "}
              <span className="font-mono font-bold">{devCode}</span>
            </p>
          )}
          <input
            required
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-indigo-400"
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? "Tekshirilmoqda..." : "Tasdiqlash"}
          </button>
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            ← Raqamni o&apos;zgartirish
          </button>
        </form>
      )}
    </div>
  );
}
