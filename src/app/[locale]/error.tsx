"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { COMPANY } from "@/lib/site";

// Shown when a page fails on the server (database hiccup, timeout): keep the visitor on the site with a way to reach sales.
export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { t, href } = useI18n();
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-slate-800">{t.common.errorTitle}</h1>
      <p className="mt-3 text-slate-500">{fmt(t.common.errorText, { phone: COMPANY.phone })}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
        <button onClick={() => retry()} className="rounded-full bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700">
          {t.common.retry}
        </button>
        <a href={`tel:${COMPANY.phoneHref}`} className="rounded-full border border-slate-200 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50">
          {COMPANY.phone}
        </a>
        <Link href={href("/")} className="rounded-full border border-slate-200 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50">
          {t.common.home}
        </Link>
      </div>
    </div>
  );
}
