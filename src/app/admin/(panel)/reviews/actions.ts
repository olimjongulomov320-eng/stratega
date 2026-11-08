"use server";

import { revalidateStorefront } from "@/lib/storefront-cache";
import { prisma } from "@/lib/prisma";
import { requireAction, audit, safe, str, optStr, int, type ActionState } from "@/lib/admin";

export async function addReview(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("products.write");
    const productId = str(form, "productId");
    const authorName = str(form, "authorName");
    const comment = str(form, "comment");
    const rating = Math.min(5, Math.max(1, int(form, "rating") ?? 5));
    if (!productId || !authorName || !comment) throw new Error("Mahsulot, muallif va matnni kiriting.");
    const r = await prisma.review.create({ data: { productId, authorName, company: optStr(form, "company"), rating, comment, isApproved: true } });
    revalidateStorefront();
    await audit(session, "Sharh qo'shildi", "Review", r.id);
    return { ok: true, message: "Sharh qo'shildi." };
  });
}

export async function toggleReview(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("products.write");
    const id = str(form, "id");
    const action = str(form, "do");
    if (action === "delete") await prisma.review.delete({ where: { id } });
    else await prisma.review.update({ where: { id }, data: { isApproved: action === "approve" } });
    revalidateStorefront();
    await audit(session, `Sharh: ${action}`, "Review", id);
  });
}
