"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogoMark } from "@/components/logo-mark";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { COMPANY } from "@/lib/site";
import { safeLocalPath } from "@/lib/safe-redirect";
import { sendOtp, verifyOtp } from "../actions";

function LoginForm() {
  const { t, href, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only allow local redirects.
  const redirectTo = safeLocalPath(searchParams.get("redirect"), href("/kabinet"));

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("+998");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await sendOtp(phone, locale);
      if (!result.ok) return setError(result.error);
      setDevCode(result.devCode ?? null);
      setStep("code");
    } catch {
      setError(fmt(t.common.sendFailed, { phone: COMPANY.phone }));
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await verifyOtp(phone, code, locale);
      if (!result.ok) return setError(result.error);
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError(fmt(t.common.sendFailed, { phone: COMPANY.phone }));
    } finally {
      setSubmitting(false);
    }
  }

  const btn = "rounded-full bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="flex items-center gap-2 self-center">
        <LogoMark className="h-9 w-9" />
        <span className="text-xl font-black tracking-tight text-slate-900">STRATEG<span className="text-indigo-600">A</span></span>
      </div>
      <h1 className="mt-8 text-center text-2xl font-bold text-slate-900">{step === "phone" ? t.auth.title : t.auth.codeTitle}</h1>
      <p className="mt-1 text-center text-sm text-slate-500">{step === "phone" ? t.auth.phoneText : fmt(t.auth.codeText, { phone })}</p>

      {step === "phone" ? (
        <form onSubmit={onSend} className="mt-8 flex flex-col gap-4">
          <input required type="tel" aria-label={t.cart.phone} autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg outline-none focus:border-indigo-400" />
          {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className={btn}>{submitting ? t.common.sending : t.auth.getCode}</button>
        </form>
      ) : (
        <form onSubmit={onVerify} className="mt-8 flex flex-col gap-4">
          {devCode && (
            <p className="rounded-lg bg-amber-50 px-4 py-2 text-center text-sm text-amber-700">
              {t.auth.demo} <span className="font-mono font-bold">{devCode}</span>
            </p>
          )}
          <input required inputMode="numeric" autoComplete="one-time-code" aria-label={t.auth.codeTitle} maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-indigo-400" />
          {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className={btn}>{submitting ? t.auth.verifying : t.auth.verify}</button>
          <button type="button" onClick={() => setStep("phone")} className="text-sm font-medium text-slate-500 hover:text-slate-700">{t.auth.changePhone}</button>
        </form>
      )}
    </div>
  );
}

export default function KirishPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
