"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };
type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "",
    items: [{ href: "/admin", label: "Bosh sahifa" }],
  },
  {
    title: "Ombor",
    items: [
      { href: "/admin/products", label: "Mahsulotlar" },
      { href: "/admin/categories", label: "Kategoriyalar" },
      { href: "/admin/stock", label: "Sklad" },
      { href: "/admin/warehouses", label: "Omborlar" },
      { href: "/admin/stock-documents", label: "Ombor hujjatlari" },
    ],
  },
  {
    title: "Savdo",
    items: [
      { href: "/admin/requests", label: "Arizalar" },
      { href: "/admin/orders", label: "Buyurtmalar" },
      { href: "/admin/customers", label: "Mijozlar" },
    ],
  },
  {
    title: "Ta'minot",
    items: [{ href: "/admin/suppliers", label: "Yetkazib beruvchilar" }],
  },
  {
    title: "Tizim",
    items: [
      { href: "/admin/employees", label: "Xodimlar" },
      { href: "/admin/audit-log", label: "Amallar tarixi" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.title || "root"}>
          {group.title && (
            <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group.title}
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
