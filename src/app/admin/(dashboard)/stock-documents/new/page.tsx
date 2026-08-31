import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { DocumentForm } from "../document-form";

export const dynamic = "force-dynamic";

export default async function NewStockDocumentPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const [warehouses, suppliers, products] = await Promise.all([
    prisma.warehouse.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.supplier.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      select: { id: true, name: true, sku: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (warehouses.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Yangi hujjat</h1>
        <p className="mt-4 text-slate-500">
          Avval kamida bitta ombor yarating.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Yangi hujjat</h1>
      <div className="mt-6 max-w-3xl rounded-xl border border-slate-200 bg-white p-6">
        <DocumentForm
          warehouses={warehouses}
          suppliers={suppliers}
          products={products}
        />
      </div>
    </div>
  );
}
