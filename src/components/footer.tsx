import Link from "next/link";
import type { HeaderCategory } from "@/components/header";

export function Footer({ categories }: { categories: HeaderCategory[] }) {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-base font-black text-white">
              S
            </span>
            <span className="text-lg font-black text-slate-900">
              Strateg<span className="text-indigo-600">a</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Qurilish va sanoat texnikasi bo&apos;yicha B2B ta&apos;minot
            platformasi. NDS, hujjatlar va shaxsiy menejer bilan.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Kategoriyalar
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {categories.slice(0, 6).map((cat) => (
              <li key={cat.id}>
                <Link href={`/category/${cat.slug}`} className="hover:text-indigo-600">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Ma&apos;lumot
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <Link href="/about" className="hover:text-indigo-600">
                Kompaniya haqida
              </Link>
            </li>
            <li>
              <Link href="/delivery" className="hover:text-indigo-600">
                Yetkazib berish va kafolat
              </Link>
            </li>
            <li>
              <Link href="/payment" className="hover:text-indigo-600">
                To&apos;lov usullari
              </Link>
            </li>
            <li>
              <Link href="/returns" className="hover:text-indigo-600">
                Qaytarish shartlari
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-indigo-600">
                Ko&apos;p beriladigan savollar
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Aloqa
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Tel: +998 90 123 45 67</li>
            <li>Manzil: Toshkent sh., O&apos;zbekiston</li>
            <li>Ish vaqti: 09:00 – 21:00</li>
            <li>
              <Link href="/contacts" className="text-indigo-600 hover:underline">
                Kontaktlar va rekvizitlar →
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Stratega. Barcha huquqlar himoyalangan.
      </div>
    </footer>
  );
}
