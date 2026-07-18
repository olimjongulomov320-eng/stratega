import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";
import { AdminLogoutButton } from "./logout-button";

const NAV_ITEMS = [
  { href: "/admin", label: "Bosh sahifa" },
  { href: "/admin/products", label: "Mahsulotlar" },
  { href: "/admin/categories", label: "Kategoriyalar" },
  { href: "/admin/requests", label: "Arizalar" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <LogoMark className="h-7 w-7" />
            <span className="text-sm font-black tracking-tight text-white">
              STRATEG<span className="text-indigo-400">A</span>{" "}
              <span className="font-normal text-slate-400">admin</span>
            </span>
          </Link>

          <nav className="flex flex-1 items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/"
            target="_blank"
            className="hidden text-sm text-slate-400 hover:text-white sm:inline"
          >
            Saytni ko&apos;rish ↗
          </Link>

          <AdminLogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
