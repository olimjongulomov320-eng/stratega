import Link from "next/link";

const INFO_LINKS = [
  { href: "/about", label: "Kompaniya haqida" },
  { href: "/delivery", label: "Yetkazib berish va kafolat" },
  { href: "/payment", label: "To'lov usullari" },
  { href: "/returns", label: "Qaytarish shartlari" },
  { href: "/faq", label: "Ko'p beriladigan savollar" },
  { href: "/contacts", label: "Kontaktlar va rekvizitlar" },
];

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="flex flex-col gap-1">
          <h2 className="mb-2 px-3 text-sm font-semibold text-slate-700">
            Ma&apos;lumot
          </h2>
          {INFO_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600"
            >
              {link.label}
            </Link>
          ))}
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
