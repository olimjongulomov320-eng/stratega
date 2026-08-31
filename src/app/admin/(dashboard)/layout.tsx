import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";
import { AdminLogoutButton } from "./logout-button";
import { AdminSidebar } from "./admin-sidebar";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-slate-950 lg:flex">
        <Link href="/admin" className="flex items-center gap-2 px-5 py-4">
          <LogoMark className="h-7 w-7" />
          <span className="text-sm font-black tracking-tight text-white">
            STRATEG<span className="text-indigo-400">A</span>
          </span>
        </Link>
        <AdminSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <LogoMark className="h-6 w-6" />
            <span className="text-sm font-black tracking-tight text-slate-900">
              STRATEGA
            </span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="hidden text-sm text-slate-500 hover:text-slate-900 sm:inline"
            >
              Saytni ko&apos;rish ↗
            </Link>
            <AdminLogoutButton />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
