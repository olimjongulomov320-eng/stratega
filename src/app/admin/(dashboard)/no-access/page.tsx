import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NoAccessPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-xl">
        🔒
      </div>
      <h1 className="mt-4 text-xl font-bold text-slate-900">Ruxsat yo&apos;q</h1>
      <p className="mt-2 text-sm text-slate-500">
        Sizning profilingizda bu bo&apos;limni ko&apos;rish uchun ruxsat
        mavjud emas. Administrator bilan bog&apos;laning.
      </p>
      <Link
        href="/admin"
        className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Bosh sahifaga qaytish
      </Link>
    </div>
  );
}
