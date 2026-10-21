import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/require-permission";

export const runtime = "nodejs";

// Tezkor mahsulot qidiruvi — shtrix-kod/ARTIKUL skaneri va ombor
// operatsiyalari uchun. Barcode skaner odatda Enter bilan yuboradi, shuning
// uchun aynan barcode/bo'yicha aniq moslik birinchi tekshiriladi.
export async function GET(req: Request) {
  try {
    await requireAdminPermission("stock.read");
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return Response.json({ products: [] });
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { barcode: q },
        { sku: q },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      sku: true,
      barcode: true,
      unit: true,
      price: true,
      costPrice: true,
      stock: true,
      isActive: true,
      stocks: {
        select: { warehouseId: true, quantity: true, reserved: true },
      },
    },
    orderBy: [{ barcode: "desc" }, { name: "asc" }], // aniq barcode birinchi
    take: 10,
  });

  return Response.json({
    products: products.map((p) => ({
      ...p,
      available: p.stock - p.stocks.reduce((s, w) => s + w.reserved, 0),
    })),
  });
}
