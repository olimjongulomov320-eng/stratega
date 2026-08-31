import type { EmployeeRole } from "@/generated/prisma/client";

// Ruxsatlar tizimi. Har bir harakat shu ro'yxatdagi kalitlardan biriga mos
// keladi. Backend HAR DOIM shu yerda tekshiradi — UI faqat tugmalarni
// yashiradi, lekin haqiqiy himoya har doim serverda.
export const PERMISSIONS = [
  "products.read",
  "products.write",
  "stock.read",
  "stock.write",
  "orders.read",
  "orders.write",
  "suppliers.read",
  "suppliers.write",
  "customers.read",
  "customers.write",
  "finance.read",
  "finance.write",
  "users.manage",
  "settings.manage",
  "audit.read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// Har bir rolga tegishli ruxsatlar to'plami. OWNER va ADMIN — hammasi.
const ROLE_PERMISSIONS: Record<EmployeeRole, Permission[]> = {
  OWNER: [...PERMISSIONS],
  ADMIN: [...PERMISSIONS],
  MANAGER: [
    "products.read",
    "products.write",
    "stock.read",
    "stock.write",
    "orders.read",
    "orders.write",
    "suppliers.read",
    "customers.read",
    "customers.write",
    "finance.read",
  ],
  WAREHOUSE: [
    "products.read",
    "stock.read",
    "stock.write",
    "orders.read",
    "suppliers.read",
  ],
  ACCOUNTANT: [
    "products.read",
    "stock.read",
    "orders.read",
    "customers.read",
    "finance.read",
    "finance.write",
  ],
  VIEWER: [
    "products.read",
    "stock.read",
    "orders.read",
    "customers.read",
    "suppliers.read",
    "finance.read",
  ],
};

export function roleHasPermission(
  role: EmployeeRole,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getRolePermissions(role: EmployeeRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
