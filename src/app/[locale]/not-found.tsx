import Link from "next/link";

// Rendered inside the [locale] layout; text is trilingual because notFound() has no locale param.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-5xl font-black text-indigo-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-800">Sahifa topilmadi · Страница не найдена</h1>
      <p className="mt-2 text-slate-500">Page not found</p>
      <div className="mt-8 flex justify-center gap-3 text-sm">
        <Link href="/" className="rounded-full bg-indigo-600 px-5 py-2.5 font-semibold text-white">O&apos;zbekcha</Link>
        <Link href="/ru" className="rounded-full border border-slate-200 px-5 py-2.5 font-semibold text-slate-700">Русский</Link>
        <Link href="/en" className="rounded-full border border-slate-200 px-5 py-2.5 font-semibold text-slate-700">English</Link>
      </div>
    </div>
  );
}
