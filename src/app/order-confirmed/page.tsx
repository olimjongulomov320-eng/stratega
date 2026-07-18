import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";

export default async function OrderConfirmedPage(
  props: PageProps<"/order-confirmed">
) {
  const searchParams = await props.searchParams;
  const id = typeof searchParams.id === "string" ? searchParams.id : undefined;

  const order = id
    ? await prisma.order.findUnique({
        where: { id },
        include: { items: { include: { product: true } } },
      })
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
        ✓
      </div>
      <h1 className="mt-6 text-2xl font-bold text-slate-800">
        Buyurtmangiz qabul qilindi!
      </h1>
      <p className="mt-2 text-slate-500">
        Tez orada operatorimiz siz bilan bog&apos;lanadi.
      </p>

      {order && (
        <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-6 text-left">
          <p className="text-sm text-slate-500">
            Buyurtma raqami:{" "}
            <span className="font-mono text-slate-700">{order.id}</span>
          </p>
          <ul className="mt-4 space-y-1 text-sm text-slate-600">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>
                  {item.product.name} × {item.quantity}
                </span>
                <span>{formatSum(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold text-slate-900">
            <span>Jami</span>
            <span>{formatSum(order.totalPrice)}</span>
          </div>
        </div>
      )}

      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
      >
        Katalogga qaytish
      </Link>
    </div>
  );
}
