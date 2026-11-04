"use server";

import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/storefront-cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAction, audit, safe, str, optStr, nextNumber, type ActionState } from "@/lib/admin";
import { postStockDocument } from "@/lib/inventory";
import { parseLines } from "@/lib/lines";
import { getSetting } from "@/lib/settings";
import type { StockDocumentType } from "@/generated/prisma/client";

const TYPES: StockDocumentType[] = ["RECEIPT", "ISSUE", "TRANSFER", "WRITE_OFF", "INVENTORY", "RETURN"];

export async function createDocument(_: ActionState, form: FormData): Promise<ActionState> {
  let id = "";
  const res = await safe(async () => {
    const session = await requireAction("stock.write");
    const type = str(form, "type") as StockDocumentType;
    if (!TYPES.includes(type)) throw new Error("Hujjat turini tanlang.");
    const warehouseId = str(form, "warehouseId");
    if (!warehouseId) throw new Error("Omborni tanlang.");
    const lines = parseLines(form.get("lines"));
    if (lines.length === 0) throw new Error("Kamida bitta mahsulot qo'shing.");
    const post = str(form, "intent") === "post";
    const allowNegative = await getSetting<boolean>("stock.allowNegative");
    await prisma.$transaction(async (tx) => {
      const doc = await tx.stockDocument.create({
        data: {
          number: await nextNumber("SD", tx),
          type,
          warehouseId,
          targetWarehouseId: type === "TRANSFER" ? optStr(form, "targetWarehouseId") : null,
          supplierId: type === "RECEIPT" ? optStr(form, "supplierId") : null,
          note: optStr(form, "note"),
          createdBy: session.name,
          lines: { create: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCost: type === "RECEIPT" ? l.price ?? null : null })) },
        },
      });
      id = doc.id;
      if (post) await postStockDocument(tx, doc.id, session.name, allowNegative);
    });
    await audit(session, post ? "Ombor hujjati o'tkazildi" : "Ombor hujjati yaratildi", "StockDocument", id, { type });
  });
  if (res?.error) return res;
  revalidateStorefront();
  redirect(`/admin/stock-documents/${id}`);
}

export async function postDocument(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("stock.write");
    const id = str(form, "id");
    const allowNegative = await getSetting<boolean>("stock.allowNegative");
    await prisma.$transaction((tx) => postStockDocument(tx, id, session.name, allowNegative));
    await audit(session, "Ombor hujjati o'tkazildi", "StockDocument", id);
    revalidateStorefront();
    return { ok: true, message: "Hujjat o'tkazildi — qoldiqlar yangilandi." };
  });
}

export async function cancelDocument(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("stock.write");
    const id = str(form, "id");
    const doc = await prisma.stockDocument.findUnique({ where: { id } });
    if (!doc) throw new Error("Hujjat topilmadi.");
    if (doc.status !== "DRAFT") throw new Error("O'tkazilgan hujjatni bekor qilib bo'lmaydi — teskari hujjat yarating.");
    await prisma.stockDocument.update({ where: { id }, data: { status: "CANCELLED" } });
    await audit(session, "Ombor hujjati bekor qilindi", "StockDocument", id);
    revalidatePath("/admin/stock-documents");
  });
}
