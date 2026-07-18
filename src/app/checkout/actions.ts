"use server";

import { prisma } from "@/lib/prisma";

type CheckoutItem = {
  productId: string;
  quantity: number;
};

type CheckoutInput = {
  customerName: string;
  customerPhone: string;
  address: string;
  comment?: string;
  items: CheckoutItem[];
};

export type CheckoutResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function placeOrder(
  input: CheckoutInput
): Promise<CheckoutResult> {
  const customerName = input.customerName.trim();
  const customerPhone = input.customerPhone.trim();
  const address = input.address.trim();

  if (!customerName || !customerPhone || !address) {
    return { ok: false, error: "Barcha majburiy maydonlarni to'ldiring." };
  }
  if (!input.items || input.items.length === 0) {
    return { ok: false, error: "Savat bo'sh." };
  }

  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  let totalPrice = 0;
  const orderItemsData: {
    productId: string;
    quantity: number;
    price: number;
  }[] = [];

  for (const item of input.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return { ok: false, error: "Mahsulotlardan biri endi mavjud emas." };
    }
    const quantity = Math.max(1, Math.floor(item.quantity));
    if (product.stock < quantity) {
      return {
        ok: false,
        error: `"${product.name}" mahsulotidan omborda yetarli emas.`,
      };
    }
    totalPrice += product.price * quantity;
    orderItemsData.push({
      productId: product.id,
      quantity,
      price: product.price,
    });
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        customerName,
        customerPhone,
        address,
        comment: input.comment?.trim() || null,
        totalPrice,
        items: { create: orderItemsData },
      },
    });

    for (const item of orderItemsData) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return created;
  });

  return { ok: true, orderId: order.id };
}
