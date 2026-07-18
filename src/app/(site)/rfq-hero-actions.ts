"use server";

import { prisma } from "@/lib/prisma";

type QuickRfqInput = {
  companyName: string;
  phone: string;
  requestType: string;
  description: string;
};

export type QuickRfqResult = { ok: true } | { ok: false; error: string };

export async function submitQuickRfq(
  input: QuickRfqInput
): Promise<QuickRfqResult> {
  const companyName = input.companyName.trim();
  const phone = input.phone.trim();
  const requestType = input.requestType.trim() || "Tezkor so'rov";

  if (!companyName || !phone) {
    return { ok: false, error: "Kompaniya nomi va telefon raqamini kiriting." };
  }

  await prisma.rfqRequest.create({
    data: {
      companyName,
      contactName: companyName,
      phone,
      requestType,
      comment: input.description.trim() || null,
    },
  });

  return { ok: true };
}
