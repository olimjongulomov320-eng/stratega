import type { Permission } from "@/lib/permissions";

export type NavItem = { href: string; label: string; permission?: Permission };
export type NavGroup = { title: string; items: NavItem[] };

// Spetsifikatsiya §24 bo'yicha yagona navigatsiya daraxti. Har bir tugma
// ruxsat kaliti bilan belgilangan; layout'da sessiya turiga qarab filtr
// qilinadi (umumiy admin — hammasi, xodim — faqat o'z ruxsatlari).
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Boshqaruv",
    items: [{ href: "/admin", label: "Bosh sahifa" }],
  },
  {
    title: "Inventar",
    items: [
      { href: "/admin/products", label: "Mahsulotlar", permission: "products.read" },
      { href: "/admin/categories", label: "Kategoriyalar", permission: "products.read" },
      { href: "/admin/stock", label: "Sklad", permission: "stock.read" },
      { href: "/admin/stock-movements", label: "Ombor harakatlari", permission: "stock.read" },
      { href: "/admin/stock-documents", label: "Ombor hujjatlari", permission: "stock.read" },
      { href: "/admin/warehouses", label: "Omborlar", permission: "stock.read" },
    ],
  },
  {
    title: "Savdo",
    items: [
      { href: "/admin/requests", label: "Arizalar (RFQ)", permission: "orders.read" },
      { href: "/admin/orders", label: "Buyurtmalar", permission: "orders.read" },
      { href: "/admin/quotations", label: "Takliflar", permission: "orders.read" },
      { href: "/admin/shipments", label: "Jo'natmalar", permission: "orders.read" },
      { href: "/admin/customers", label: "Mijozlar", permission: "customers.read" },
    ],
  },
  {
    title: "Ta'minot",
    items: [
      { href: "/admin/suppliers", label: "Yetkazib beruvchilar", permission: "suppliers.read" },
    ],
  },
  {
    title: "Moliya",
    items: [
      { href: "/admin/payments", label: "To'lovlar", permission: "finance.read" },
      { href: "/admin/price-lists", label: "Narxlar ro'yxati", permission: "finance.read" },
    ],
  },
  {
    title: "Tahlil",
    items: [
      { href: "/admin/analytics", label: "Savdo tahlili", permission: "orders.read" },
      { href: "/admin/analytics/inventory", label: "Inventar tahlili", permission: "stock.read" },
    ],
  },
  {
    title: "Tizim",
    items: [
      { href: "/admin/roles", label: "Rollar va ruxsatlar", permission: "users.manage" },
      { href: "/admin/employees", label: "Xodimlar", permission: "users.manage" },
      { href: "/admin/alerts", label: "Ogohlantirishlar", permission: "stock.read" },
      { href: "/admin/settings", label: "Sozlamalar", permission: "settings.manage" },
      { href: "/admin/audit-log", label: "Amallar tarixi", permission: "audit.read" },
    ],
  },
];
