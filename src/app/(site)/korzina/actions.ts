"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type RfqItemInput = {
  productId: string;
  quantity: number;
};

type RfqInput = {
  companyName: string;
  contactName: string;
  phone: string;
  requestType: string;
  comment?: string;
  items: RfqItemInput[];
};

export type RfqResult =
  | { ok: true; requestId: string }
  | { ok: false; error: string };

export async function submitRfq(input: RfqInput): Promise<RfqResult> {
  const companyName = input.companyName.trim();
  const contactName = input.contactName.trim();
  const phone = input.phone.trim();
  const requestType = input.requestType.trim();

  if (!companyName || !contactName || !phone || !requestType) {
    return { ok: false, error: "Barcha majburiy maydonlarni to'ldiring." };
  }
  if (!input.items || input.items.length === 0) {
    return { ok: false, error: "Korzina bo'sh." };
  }

  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  const rfqItemsData: {
    productId: string;
    quantity: number;
    priceAtQuote: number;
  }[] = [];

  for (const item of input.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return { ok: false, error: "Mahsulotlardan biri endi mavjud emas." };
    }
    const quantity = Math.max(1, Math.floor(item.quantity));
    rfqItemsData.push({
      productId: product.id,
      quantity,
      priceAtQuote: product.price,
    });
  }

  const currentUser = await getCurrentUser();

  const request = await prisma.rfqRequest.create({
    data: {
      companyName,
      contactName,
      phone,
      requestType,
      comment: input.comment?.trim() || null,
      items: { create: rfqItemsData },
      ...(currentUser ? { userId: currentUser.id } : {}),
    },
  });

  if (currentUser && !currentUser.companyName) {
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { companyName, contactName },
    });
  }

  return { ok: true, requestId: request.id };
}
