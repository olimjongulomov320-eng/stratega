import type { AdminRole } from "@/lib/admin-auth";

export const PERMISSIONS = [
  "products.read",
  "products.write",
  "stock.read",
  "stock.write",
  "orders.read",
  "orders.write",
  "customers.read",
  "customers.write",
  "suppliers.read",
  "suppliers.write",
  "finance.read",
  "finance.write",
  "users.manage",
  "settings.manage",
  "audit.read",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ALL = [...PERMISSIONS];

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  OWNER: ALL,
  ADMIN: ALL.filter((p) => p !== "users.manage") as Permission[],
  MANAGER: [
    "products.read",
    "stock.read",
    "orders.read",
    "orders.write",
    "customers.read",
    "customers.write",
    "suppliers.read",
    "finance.read",
    "products.write",
    "audit.read",
  ],
  WAREHOUSE: ["products.read", "stock.read", "stock.write", "orders.read", "suppliers.read"],
  ACCOUNTANT: ["products.read", "orders.read", "customers.read", "finance.read", "finance.write", "audit.read"],
  VIEWER: ["products.read", "stock.read", "orders.read", "customers.read"],
};

export const ROLE_LABELS: Record<AdminRole, { name: string; description: string }> = {
  OWNER: { name: "Egasi", description: "Barcha ruxsatlar, xodimlarni boshqarish." },
  ADMIN: { name: "Administrator", description: "To'liq boshqaruv: mahsulot, ombor, moliya, sozlamalar (xodimlarsiz)." },
  MANAGER: { name: "Menejer", description: "Savdo: buyurtmalar, takliflar, mijozlar; moliyani ko'rish." },
  WAREHOUSE: { name: "Omborchi", description: "Ombor ishlari: kirim, chiqim, hujjatlar; buyurtmalarni ko'rish." },
  ACCOUNTANT: { name: "Buxgalter", description: "Moliya: to'lovlar, hisobotlar; ombor yozuvlarisiz." },
  VIEWER: { name: "Kuzatuvchi", description: "Faqat ko'rish: mahsulot, ombor, buyurtma, mijozlar." },
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  "products.read": "Mahsulotlarni ko'rish",
  "products.write": "Mahsulotlarni tahrirlash",
  "stock.read": "Omborni ko'rish",
  "stock.write": "Ombor operatsiyalari",
  "orders.read": "Buyurtmalarni ko'rish",
  "orders.write": "Buyurtmalarni boshqarish",
  "customers.read": "Mijozlarni ko'rish",
  "customers.write": "Mijozlarni tahrirlash",
  "suppliers.read": "Yetkazib beruvchilarni ko'rish",
  "suppliers.write": "Yetkazib beruvchilarni tahrirlash",
  "finance.read": "Moliyani ko'rish",
  "finance.write": "To'lovlarni qayd etish",
  "users.manage": "Xodimlarni boshqarish",
  "settings.manage": "Sozlamalar",
  "audit.read": "Amallar tarixi",
};

export function can(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
