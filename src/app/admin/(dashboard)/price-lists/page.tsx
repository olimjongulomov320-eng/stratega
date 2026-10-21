import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/require-permission";
import { PriceListPanel } from "./price-list-panel";
import { NewPriceListButton } from "./new-button";

export const dynamic = "force-dynamic";

export default async function PriceListsPage() {
  await requirePagePermission("finance.read");

  const [priceLists, products] = await Promise.all([
    prisma.priceList.findMany({
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      include: {
        items: {
          include: { product: { select: { id: true, name: true, price: true, sku: true } } },
        },
        _count: { select: { items: true, customers: true } },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, price: true, sku: true, costPrice: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Narxlar ro&apos;yxatlari</h1>
          <p className="mt-1 text-slate-500">
            Mijozlar guruhi uchun maxsus narxlar (PriceList) — chakana narx RETAIL
            ro&apos;yxati bilan sinxron.
          </p>
        </div>
        <NewPriceListButton />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {priceLists.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-400">
            Narxlar ro&apos;yxati hali yo&apos;q — yuqoridagi tugma orqali yarating.
          </div>
        )}
        {priceLists.map((list) => (
          <PriceListPanel
            key={list.id}
            list={{
              id: list.id,
              name: list.name,
              kind: list.kind,
              isDefault: list.isDefault,
              customerCount: list._count.customers,
              items: list.items.map((i) => ({
                productId: i.productId,
                productName: i.product.name,
                productSku: i.product.sku,
                price: i.price,
                basePrice: i.product.price,
              })),
            }}
            products={products}
          />
        ))}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Har bir ro&apos;yxat mahsulot bo&apos;yicha alohida narx saqlaydi; bo&apos;sh
        qolgan mahsulotlar chakana narx (product.price) bo&apos;yicha hisoblanadi.
      </p>
    </div>
  );
}
