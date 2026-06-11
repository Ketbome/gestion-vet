import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db, products } from "@/lib/db";
import { createOrder } from "@/lib/actions/orders";
import { PageHeader } from "@/components/ui/page-header";
import { OrderForm } from "@/components/pedidos/order-form";

export const metadata: Metadata = { title: "Nuevo pedido" };

export default function NuevoPedidoPage() {
  const productOptions = db
    .select({
      id: products.id,
      name: products.name,
      stock: products.stock,
      salePrice: products.salePrice,
      costPrice: products.costPrice,
    })
    .from(products)
    .where(eq(products.active, true))
    .orderBy(asc(products.name))
    .all();

  return (
    <>
      <PageHeader
        title="Nuevo pedido"
        subtitle="El stock se sumará al inventario cuando lo marques como recibido"
      />
      <OrderForm products={productOptions} action={createOrder} />
    </>
  );
}
