"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { logout } from "@/app/kirish/actions";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

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
      {pending ? "..." : "Chiqish"}
    </button>
  );
}
