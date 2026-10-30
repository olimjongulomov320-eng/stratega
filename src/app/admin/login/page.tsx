"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { LogoMark } from "@/components/logo-mark";
import { inputCls, btn } from "@/components/admin/ui";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form action={action} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2">
          <LogoMark className="h-9 w-9" />
          <span className="text-xl font-black">STRATEG<span className="text-indigo-600">A</span></span>
        </div>
        <h1 className="mt-6 text-lg font-bold text-slate-900">Boshqaruv paneli</h1>
        <label className="mt-5 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Email (xodim uchun)</span>
          <input name="email" type="email" autoComplete="username" className={inputCls} />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Parol</span>
          <input name="password" type="password" required autoComplete="current-password" className={inputCls} />
        </label>
        <p className="mt-2 text-xs text-slate-400">Email bo&apos;sh qolsa — umumiy admin paroli bilan kiriladi.</p>
        {state?.error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        <button disabled={pending} className={`${btn()} mt-5 w-full`}>{pending ? "..." : "Kirish"}</button>
      </form>
    </div>
  );
}
