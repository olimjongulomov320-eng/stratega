import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { ImportForm } from "./import-form";

export const dynamic = "force-dynamic";

export default async function ProductImportPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">CSV import</h1>
      <p className="mt-1 text-slate-500">
        Ko&apos;p mahsulotning narxi va ombordagi sonini bitta faylda
        yangilang.
      </p>

      <div className="mt-6 max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">
          Fayl formati: birinchi qatorda ustun nomlari, keyin har bir
          mahsulot uchun bitta qator.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
{`slug,narx,ombordagi_soni
premium-armatura-12mm,45000,120`}
        </pre>
        <p className="mt-2 text-xs text-slate-400">
          Slug — mahsulot havolasidagi qism (masalan, saytdagi
          /product/<b>premium-armatura-12mm</b>). Narx yoki ombordagi sonni
          bo&apos;sh qoldirsangiz, o&apos;sha ustun o&apos;zgartirilmaydi.
        </p>

        <ImportForm />
      </div>
    </div>
  );
}
