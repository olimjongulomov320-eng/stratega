import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ui";
import { WarehouseForm } from "../warehouse-form";

export default async function EditWarehousePage(props: PageProps<"/admin/warehouses/[id]">) {
  await requirePage("stock.write");
  const { id } = await props.params;
  const w = await prisma.warehouse.findUnique({ where: { id } });
  if (!w) notFound();
  return (
    <div>
      <PageHeader title={w.name} back={{ href: "/admin/warehouses", label: "Omborlar" }} />
      <WarehouseForm values={w} />
    </div>
  );
}
