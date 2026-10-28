"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/employee-auth";
import { requireAdminPermission } from "@/lib/require-permission";
import { writeAuditLog } from "@/lib/audit";

export type PriceListActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

async function getActorId(): Promise<string | null> {
  const employee = await getCurrentEmployee();
  return employee?.id ?? null;
}

function handle(err: unknown): { ok: false; error: string } {
  return { ok: false, error: err instanceof Error ? err.message : String(err) };
}

export async function createPriceListAction(input: {
  name: string;
  isDefault?: boolean;
}): Promise<PriceListActionResult> {
  await requireAdminPermission("finance.write");
  const actorId = await getActorId();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Narxlar ro'yxati nomini kiriting." };

  try {
    const created = await prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.priceList.updateMany({ data: { isDefault: false } });
      }
      const list = await tx.priceList.create({
        data: { name, isDefault: input.isDefault ?? false },
      });
      await writeAuditLog(
        {
          actorId,
          action: "price_list.create",
          entity: "PriceList",
          entityId: list.id,
          newData: { name },
        },
        tx
      );
      return list;
    });
    revalidatePath("/admin/price-lists");
    return { ok: true, id: created.id };
  } catch (err) {
    return handle(err);
  }
}

export async function deletePriceListAction(priceListId: string): Promise<PriceListActionResult> {
  await requireAdminPermission("finance.write");
  const actorId = await getActorId();
  try {
    const existing = await prisma.priceList.findUnique({ where: { id: priceListId } });
    if (!existing) return { ok: false, error: "Ro'yxat topilmadi." };
    if (existing.isDefault) {
      return { ok: false, error: "Asosiy (default) narxlar ro'yxatini o'chirib bo'lmaydi." };
    }
    await prisma.$transaction(async (tx) => {
      await tx.priceList.delete({ where: { id: priceListId } }); // items cascade
      await writeAuditLog(
        {
          actorId,
          action: "price_list.delete",
          entity: "PriceList",
          entityId: priceListId,
          oldData: { name: existing.name },
        },
        tx
      );
    });
    revalidatePath("/admin/price-lists");
    return { ok: true };
  } catch (err) {
    return handle(err);
  }
}

// Ro'yxatdagi bitta mahsulot narxini qo'shish/yangilash.
export async function upsertPriceListItemAction(
  priceListId: string,
  productId: string,
  price: number
): Promise<PriceListActionResult> {
  await requireAdminPermission("finance.write");
  const actorId = await getActorId();
  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, error: "Narx noto'g'ri." };
  }
  try {
    await prisma.$transaction(async (tx) => {
      const [list, product, previous] = await Promise.all([
        tx.priceList.findUnique({ where: { id: priceListId }, select: { name: true } }),
        tx.product.findUnique({ where: { id: productId }, select: { price: true } }),
        tx.priceListItem.findUnique({
          where: { priceListId_productId: { priceListId, productId } },
          select: { price: true },
        }),
      ]);
      if (!list || !product) throw new Error("Ro'yxat yoki mahsulot topilmadi.");
      const newPrice = Math.round(price);
      const oldPrice = previous?.price ?? product.price;
      await tx.priceListItem.upsert({
        where: { priceListId_productId: { priceListId, productId } },
        create: { priceListId, productId, price: newPrice },
        update: { price: newPrice },
      });
      if (oldPrice !== newPrice) {
        await tx.priceHistory.create({
          data: {
            productId,
            oldPrice,
            newPrice,
            changedBy: actorId ?? "system",
            reason: `Narxlar ro'yxati: ${list.name}`,
          },
        });
      }
      await writeAuditLog(
        {
          actorId,
          action: "price_list.item_upsert",
          entity: "PriceList",
          entityId: priceListId,
          newData: { productId, price: Math.round(price) },
        },
        tx
      );
    });
    revalidatePath("/admin/price-lists");
    return { ok: true };
  } catch (err) {
    return handle(err);
  }
}

export async function removePriceListItemAction(
  priceListId: string,
  productId: string
): Promise<PriceListActionResult> {
  await requireAdminPermission("finance.write");
  const actorId = await getActorId();
  try {
    await prisma.$transaction(async (tx) => {
      const [list, product, previous] = await Promise.all([
        tx.priceList.findUnique({ where: { id: priceListId }, select: { name: true } }),
        tx.product.findUnique({ where: { id: productId }, select: { price: true } }),
        tx.priceListItem.findUnique({
          where: { priceListId_productId: { priceListId, productId } },
          select: { price: true },
        }),
      ]);
      await tx.priceListItem.deleteMany({ where: { priceListId, productId } });
      // Ro'yxatdan chiqarilgach mahsulot asosiy narxga qaytadi — bu ham narx o'zgarishi.
      if (list && product && previous && previous.price !== product.price) {
        await tx.priceHistory.create({
          data: {
            productId,
            oldPrice: previous.price,
            newPrice: product.price,
            changedBy: actorId ?? "system",
            reason: `Narxlar ro'yxatidan chiqarildi: ${list.name}`,
          },
        });
      }
      await writeAuditLog(
        {
          actorId,
          action: "price_list.item_remove",
          entity: "PriceList",
          entityId: priceListId,
          oldData: { productId },
        },
        tx
      );
    });
    revalidatePath("/admin/price-lists");
    return { ok: true };
  } catch (err) {
    return handle(err);
  }
}
