"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSupplier } from "./actions";

export function DeleteSupplierButton({
  supplierId,
  supplierName,
}: {
  supplierId: string;
  supplierName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !confirm(`"${supplierName}" yetkazib beruvchisini o'chirishni tasdiqlaysizmi?`)
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteSupplier(supplierId);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
    >
      {pending ? "..." : "O'chirish"}
    </button>
  );
}
