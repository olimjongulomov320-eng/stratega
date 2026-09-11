"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { logout } from "@/app/[locale]/(site)/kirish/actions";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const t = useTranslations("logout");

  function handleLogout() {
    startTransition(async () => {
      await logout();
      router.push("/");
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleLogout}
      disabled={pending}
      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-red-200 hover:text-red-600"
    >
      {pending ? "..." : t("button")}
    </button>
  );
}
