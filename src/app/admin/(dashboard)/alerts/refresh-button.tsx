"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshAlertsAction } from "./actions";

export function RefreshAlertsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await refreshAlertsAction();
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
    >
      {pending ? "Hisoblanmoqda…" : "Qayta hisoblash"}
    </button>
  );
}
