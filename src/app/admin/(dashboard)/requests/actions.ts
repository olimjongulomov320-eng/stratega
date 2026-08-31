"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { recordStockChange } from "@/lib/stock";
import type { RfqStatus } from "@/generated/prisma/client";

export async function updateRequestStatus(
  requestId: string,
  status: RfqStatus
) {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }

  await prisma.$transaction(async (tx) => {
    // Qatorni bloklaymiz — parallel so'rovlar (masalan, ikki marta
    // bosish) navbat bilan ishlashini kafolatlaydi, aks holda ikkalasi
    // ham eski holatni o'qib, ikkala marta chiqim/qaytarish yozishi mumkin.
    await tx.$executeRaw`SELECT id FROM "RfqRequest" WHERE id = ${requestId} FOR UPDATE`;

    const request = await tx.rfqRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: { items: true },
    });

    // Xuddi shu holatni qayta tanlash hech qanday qo'shimcha
    // ta'sir qilmasligi kerak (qayta chiqim/qaytarish yo'q).
    if (request.status === status) return;

    await tx.rfqRequest.update({ where: { id: requestId }, data: { status } });

    const [deductedCount, reversedCount] = await Promise.all([
      tx.stockMove.count({
        where: { requestId, reason: "ORDER", change: { lt: 0 } },
      }),
      tx.stockMove.count({
        where: { requestId, reason: "ORDER", change: { gt: 0 } },
      }),
    ]);
    const netDeducted = deductedCount > reversedCount;

    if (status === "CONFIRMED" && !netDeducted) {
      for (const item of request.items) {
        await recordStockChange(tx, {
          productId: item.productId,
          change: -item.quantity,
          reason: "ORDER",
          requestId,
          note: "Ariza tasdiqlandi",
        });
      }
    }

    if (
      status === "CANCELLED" &&
      request.status === "CONFIRMED" &&
      netDeducted
    ) {
      // So'nggi chiqim yozuvlariga emas, hozirgi RfqItem ro'yxatiga qarab
      // qaytaramiz — aks holda oldingi tasdiqlash/bekor qilish tsikllaridan
      // qolgan eski chiqim yozuvlari qayta-qayta qaytarilib ketadi.
      for (const item of request.items) {
        await recordStockChange(tx, {
          productId: item.productId,
          change: item.quantity,
          reason: "ORDER",
          requestId,
          note: "Ariza bekor qilindi — qoldiq qaytarildi",
        });
      }
    }
  });

  revalidatePath("/admin/requests");
  revalidatePath("/admin/products");
}
