"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminLogout } from "./actions";

export function AdminLogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await adminLogout();
          router.push("/admin/login");
          router.refresh();
        })
      }
      disabled={pending}
      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
    >
      Chiqish
    </button>
  );
}
