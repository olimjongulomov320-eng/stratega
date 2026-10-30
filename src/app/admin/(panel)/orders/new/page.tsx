import { requirePage } from "@/lib/admin";
import { PageHeader, Empty } from "@/components/admin/ui";
import { OrderForm } from "../order-form";
import { orderFormData } from "../data";
import { createOrder } from "../actions";

export default async function NewOrderPage(props: PageProps<"/admin/orders/new">) {
  await requirePage("orders.write");
  const sp = await props.searchParams;
  const data = await orderFormData();
  return (
    <div>
      <PageHeader title="Yangi buyurtma" back={{ href: "/admin/orders", label: "Buyurtmalar" }} />
      {data.warehouses.length === 0 ? (
        <Empty>Avval ombor yarating.</Empty>
      ) : (
        <OrderForm action={createOrder} {...data} values={{ customerId: typeof sp.customer === "string" ? sp.customer : null }} />
      )}
    </div>
  );
}
