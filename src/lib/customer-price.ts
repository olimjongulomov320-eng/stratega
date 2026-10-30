import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/** Last 9 digits of a phone number — "+998 (90) 123-45-67" and "901234567" match. */
export function phoneKey(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : "";
}

/**
 * The price list of the logged-in buyer: the website user is matched to a Customer (company)
 * by phone number; the customer's active price list gives their prices. Null for guests.
 */
export const getBuyerPriceList = cache(async (): Promise<{ id: string; name: string; companyName: string } | null> => {
  const user = await getCurrentUser();
  const key = phoneKey(user?.phone);
  if (!key) return null;
  const customers = await prisma.customer.findMany({
    where: { isActive: true, phone: { not: null }, priceList: { is: { isActive: true } } },
    select: { phone: true, companyName: true, priceList: { select: { id: true, name: true } } },
  });
  const match = customers.find((c) => phoneKey(c.phone) === key);
  return match?.priceList ? { id: match.priceList.id, name: match.priceList.name, companyName: match.companyName } : null;
});

/** productId → the buyer's price, for the given products. Empty for guests / buyers without a price list. */
export async function getBuyerPrices(productIds: string[]): Promise<Map<string, number>> {
  const list = await getBuyerPriceList();
  if (!list || productIds.length === 0) return new Map();
  const items = await prisma.priceListItem.findMany({
    where: { priceListId: list.id, productId: { in: productIds }, price: { gt: 0 } },
    select: { productId: true, price: true },
  });
  return new Map(items.map((i) => [i.productId, i.price]));
}
