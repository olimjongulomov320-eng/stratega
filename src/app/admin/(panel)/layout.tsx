import { requirePage } from "@/lib/admin";
import { can, ROLE_LABELS, type Permission } from "@/lib/permissions";
import { AdminNav, type NavGroup } from "./nav";
import { logoutAdmin } from "../login/actions";

export const dynamic = "force-dynamic";

const NAV: { title: string; items: { href: string; label: string; perm: Permission }[] }[] = [
  { title: "Asosiy", items: [{ href: "/admin", label: "Bosh sahifa", perm: "products.read" }] },
  {
    title: "Katalog",
    items: [
      { href: "/admin/products", label: "Mahsulotlar", perm: "products.read" },
      { href: "/admin/categories", label: "Kategoriyalar", perm: "products.read" },
      { href: "/admin/reviews", label: "Sharhlar", perm: "products.write" },
    ],
  },
  {
    title: "Ombor",
    items: [
      { href: "/admin/stock", label: "Sklad (qoldiqlar)", perm: "stock.read" },
      { href: "/admin/stock-movements", label: "Ombor harakatlari", perm: "stock.read" },
      { href: "/admin/stock-documents", label: "Ombor hujjatlari", perm: "stock.read" },
      { href: "/admin/warehouses", label: "Omborlar", perm: "stock.read" },
    ],
  },
  {
    title: "Savdo",
    items: [
      { href: "/admin/requests", label: "Arizalar (RFQ)", perm: "orders.read" },
      { href: "/admin/quotations", label: "Takliflar", perm: "orders.read" },
      { href: "/admin/orders", label: "Buyurtmalar", perm: "orders.read" },
      { href: "/admin/shipments", label: "Jo'natmalar", perm: "orders.read" },
      { href: "/admin/customers", label: "Mijozlar", perm: "customers.read" },
    ],
  },
  { title: "Ta'minot", items: [{ href: "/admin/suppliers", label: "Yetkazib beruvchilar", perm: "suppliers.read" }] },
  {
    title: "Moliya",
    items: [
      { href: "/admin/payments", label: "To'lovlar", perm: "finance.read" },
      { href: "/admin/price-lists", label: "Narxlar ro'yxati", perm: "finance.read" },
    ],
  },
  {
    title: "Hisobotlar",
    items: [
      { href: "/admin/analytics", label: "Savdo tahlili", perm: "finance.read" },
      { href: "/admin/analytics/inventory", label: "Inventar tahlili", perm: "stock.read" },
      { href: "/admin/analytics/suppliers", label: "Yetkazib beruvchilar tahlili", perm: "suppliers.read" },
      { href: "/admin/alerts", label: "Ogohlantirishlar", perm: "stock.read" },
    ],
  },
  {
    title: "Tizim",
    items: [
      { href: "/admin/employees", label: "Xodimlar", perm: "users.manage" },
      { href: "/admin/roles", label: "Rollar va ruxsatlar", perm: "users.manage" },
      { href: "/admin/settings", label: "Sozlamalar", perm: "settings.manage" },
      { href: "/admin/audit-log", label: "Amallar tarixi", perm: "audit.read" },
    ],
  },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePage();
  const groups: NavGroup[] = NAV.map((g) => ({
    title: g.title,
    items: g.items.filter((i) => can(session.role, i.perm)).map(({ href, label }) => ({ href, label })),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen">
      <AdminNav groups={groups} />
      <div className="lg:pl-64 print:pl-0">
        <header className="print:hidden sticky top-0 z-30 flex items-center justify-end gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-8">
          <a href="/" target="_blank" className="mr-auto pl-24 text-sm text-slate-500 hover:text-indigo-600 lg:pl-0">
            Saytni ochish ↗
          </a>
          <span className="text-sm text-slate-600">
            {session.name} · <span className="text-slate-400">{ROLE_LABELS[session.role].name}</span>
          </span>
          <form action={logoutAdmin}>
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Chiqish</button>
          </form>
        </header>
        <main className="px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
