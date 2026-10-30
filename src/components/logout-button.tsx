"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { logout } from "@/app/[locale]/actions";

export function LogoutButton({ label, homeHref }: { label: string; homeHref: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await logout();
          router.push(homeHref);
          router.refresh();
        })
      }
      disabled={pending}
      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-red-200 hover:text-red-600"
    >
      {pending ? "..." : label}
    </button>
  );
}
