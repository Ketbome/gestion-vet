import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import {
  db,
  attentions,
  attentionProducts,
  attentionServices,
  products,
  services,
} from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updateAttention, updateAttentionClinical } from "@/lib/actions/attentions";
import { getSchedulableVets } from "@/lib/queries/vets";
import { getClinicMode } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { ClinicalFieldsForm } from "@/components/atenciones/clinical-fields-form";
import { AttentionForm } from "@/components/atenciones/attention-form";

export const metadata: Metadata = { title: "Editar atención" };

export default async function EditarAtencionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/atenciones");

  const { id } = await params;
  const attention = db
    .select()
    .from(attentions)
    .where(eq(attentions.id, Number(id)))
    .get();
  if (!attention) notFound();

  if (getClinicMode() === "completo") {
    if (me.role === "recepcion") redirect("/atenciones");
    const vets = getSchedulableVets();
    return (
      <>
        <PageHeader title="Editar ficha clínica" subtitle={attention.petName} />
        <Card className="max-w-2xl p-5">
          <ClinicalFieldsForm
            attention={attention}
            vets={vets}
            action={updateAttentionClinical.bind(null, attention.id)}
          >
            <SubmitButton>Guardar ficha</SubmitButton>
          </ClinicalFieldsForm>
        </Card>
      </>
    );
  }

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

  const serviceLines = db
    .select({
      serviceId: attentionServices.serviceId,
      name: services.name,
      price: services.price,
      quantity: attentionServices.quantity,
    })
    .from(attentionServices)
    .innerJoin(services, eq(attentionServices.serviceId, services.id))
    .where(eq(attentionServices.attentionId, attention.id))
    .all();

  const productLines = db
    .select({
      productId: attentionProducts.productId,
      name: products.name,
      price: products.salePrice,
      stock: products.stock,
      quantity: attentionProducts.quantity,
    })
    .from(attentionProducts)
    .innerJoin(products, eq(attentionProducts.productId, products.id))
    .where(eq(attentionProducts.attentionId, attention.id))
    .all();

  return (
    <>
      <PageHeader title="Editar atención" subtitle={attention.petName} />
      <AttentionForm
        services={serviceOptions}
        products={productOptions}
        action={updateAttention.bind(null, attention.id)}
        defaultDate={attention.date}
        mode="basico"
        isEdit
        submitLabel="Guardar cambios"
        initial={{
          petName: attention.petName,
          ownerName: attention.ownerName,
          notes: attention.notes ?? "",
          serviceLines,
          productLines,
          discountType: "amount",
          discountValue: attention.discount,
        }}
      />
    </>
  );
}
