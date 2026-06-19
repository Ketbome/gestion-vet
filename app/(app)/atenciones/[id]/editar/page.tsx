import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, attentions } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updateAttentionClinical } from "@/lib/actions/attentions";
import { getSchedulableVets } from "@/lib/queries/vets";
import { getClinicMode } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { ClinicalFieldsForm } from "@/components/atenciones/clinical-fields-form";

export const metadata: Metadata = { title: "Editar ficha clínica" };

export default async function EditarAtencionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (getClinicMode() !== "completo") redirect("/atenciones");
  const me = await getCurrentUser();
  if (!me || me.role === "recepcion") redirect("/atenciones");

  const { id } = await params;
  const attention = db
    .select()
    .from(attentions)
    .where(eq(attentions.id, Number(id)))
    .get();
  if (!attention) notFound();

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
