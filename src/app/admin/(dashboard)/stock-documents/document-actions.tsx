"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { postDocument, cancelDocument } from "./actions";

export function DocumentActions({
  documentId,
  status,
}: {
  documentId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handlePost() {
    if (!confirm("Hujjatni проводка qilishni tasdiqlaysizmi? Ombor qoldig'i o'zgaradi.")) {
      return;
    }
    startTransition(async () => {
      const result = await postDocument(documentId);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleCancel() {
    if (!confirm("Hujjatni bekor qilishni tasdiqlaysizmi?")) return;
    startTransition(async () => {
      const result = await cancelDocument(documentId);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (status === "CANCELLED") return null;

  return (
    <div className="flex gap-3">
      {status === "DRAFT" && (
        <button
          onClick={handlePost}
          disabled={pending}
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? "..." : "Проводить"}
        </button>
      )}
      <button
        onClick={handleCancel}
        disabled={pending}
        className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
      >
        {pending ? "..." : "Bekor qilish"}
      </button>
    </div>
  );
}
