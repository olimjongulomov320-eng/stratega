"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import type { RfqStatus } from "@/generated/prisma/client";

export async function updateRequestStatus(
  requestId: string,
  status: RfqStatus
) {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }

  await prisma.rfqRequest.update({
    where: { id: requestId },
    data: { status },
  });

  revalidatePath("/admin/requests");
}
