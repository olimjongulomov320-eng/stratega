import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/logo-mark";
import { isAdminAuthenticated, isSharedAdminSession } from "@/lib/admin-auth";
import { getCurrentEmployee } from "@/lib/employee-auth";
import { roleHasPermission } from "@/lib/permissions";
import { AdminLogoutButton } from "./logout-button";
import { AdminSidebar } from "./admin-sidebar";
import { GlobalSearch } from "./global-search";
import { CommandMenu } from "./command-menu";
import { MobileNav } from "./mobile-nav";
import { NAV_GROUPS, type NavGroup } from "./nav";

export const dynamic = "force-dynamic";

// Joriy sessiya uchun ruxsat berilgan navigatsiya guruhlarini filtrlaydi.
// Umumiy admin paroli — barcha bo'limlar; xodim — faqat o'z ruxsatlari.
async function getVisibleNavGroups(): Promise<NavGroup[]> {
  if (await isSharedAdminSession()) return NAV_GROUPS;
  const employee = await getCurrentEmployee();
  if (!employee) return [];
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.permission || roleHasPermission(employee.role, item.permission)
    ),
  })).filter((group) => group.items.length > 0);
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Barcha /admin/(dashboard) sahifalari uchun yagona autentifikatsiya
  // himoyasi — page-level ruxsat (permission) tekshiruvi esa har bir
  // sahifada requirePagePermission orqali alohida bajariladi.
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const groups = await getVisibleNavGroups();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-slate-950 lg:flex">
        <Link href="/admin" className="flex items-center gap-2 px-5 py-4">
          <LogoMark className="h-7 w-7" />
          <span className="text-sm font-black tracking-tight text-white">
            STRATEG<span className="text-indigo-400">A</span>
          </span>
        </Link>
        <AdminSidebar groups={groups} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
          <div className="flex items-center gap-2">
            <MobileNav groups={groups} />
            <Link href="/admin" className="flex items-center gap-2 lg:hidden">
              <LogoMark className="h-6 w-6" />
              <span className="text-sm font-black tracking-tight text-slate-900">
                STRATEGA
              </span>
            </Link>
          </div>
          <div className="hidden min-w-0 flex-1 justify-center md:flex">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-3">
            <CommandMenu />
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
