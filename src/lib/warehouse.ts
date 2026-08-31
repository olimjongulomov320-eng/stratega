import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const MAIN_WAREHOUSE_CODE = "MAIN";

let cachedMainWarehouseId: string | null = null;

// Standart ("Asosiy") ombor id'sini qaytaradi — mavjud bo'lmasa yaratadi.
// Natija jarayon davomida keshlanadi (Warehouse ro'yxati kam o'zgaradi).
export async function getMainWarehouseId(
  tx?: Prisma.TransactionClient
): Promise<string> {
  if (cachedMainWarehouseId) return cachedMainWarehouseId;

  const client = tx ?? prisma;
  const warehouse = await client.warehouse.upsert({
    where: { code: MAIN_WAREHOUSE_CODE },
    create: { code: MAIN_WAREHOUSE_CODE, name: "Asosiy ombor" },
    update: {},
  });

  cachedMainWarehouseId = warehouse.id;
  return warehouse.id;
}
