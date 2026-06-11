import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db, products, services } from "@/lib/db";
import { createAttention } from "@/lib/actions/attentions";
import { today } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { AttentionForm } from "@/components/atenciones/attention-form";

export const metadata: Metadata = { title: "Nueva atención" };

export default function NuevaAtencionPage() {
  const serviceOptions = db
    .select({ id: services.id, name: services.name, price: services.price })
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.name))
    .all();

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
        title="Nueva atención"
        subtitle="Registra la visita con sus servicios y productos"
      />
      <AttentionForm
        services={serviceOptions}
        products={productOptions}
        action={createAttention}
        defaultDate={today()}
      />
    </>
  );
}
