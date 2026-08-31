import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { OrderForm } from "../order-form";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const [customers, warehouses, products] = await Promise.all([
    prisma.customer.findMany({
      where: { isActive: true },
      select: { id: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
    prisma.warehouse.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      select: { id: true, name: true, price: true, sku: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (warehouses.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Yangi buyurtma</h1>
        <p className="mt-4 text-slate-500">
          Avval kamida bitta ombor yarating.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Yangi buyurtma</h1>
      <div className="mt-6 max-w-3xl rounded-xl border border-slate-200 bg-white p-6">
        <OrderForm
          customers={customers}
          warehouses={warehouses}
          products={products}
        />
      </div>
    </div>
  );
}
