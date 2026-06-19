import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, pets, products } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSchedulableVets } from "@/lib/queries/vets";
import { today } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { PrescriptionForm } from "@/components/recetas/prescription-form";

export const metadata: Metadata = { title: "Nueva receta" };

export default async function NuevaRecetaPage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string; attention?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me || me.role === "recepcion") redirect("/");

  const { pet: petParam, attention } = await searchParams;
  const pet = db
    .select()
    .from(pets)
    .where(eq(pets.id, Number(petParam)))
    .get();
  if (!pet) notFound();

  const vets = getSchedulableVets();

  const medications = db
    .select({ name: products.name })
    .from(products)
    .where(eq(products.active, true))
    .orderBy(asc(products.name))
    .all()
    .map((p) => p.name);

  const attentionId = Number(attention) || undefined;
  const defaultVetId = vets.some((v) => v.id === me.uid) ? me.uid : undefined;

  return (
    <>
      <PageHeader title="Nueva receta" subtitle={pet.name} />
      <PrescriptionForm
        petId={pet.id}
        attentionId={attentionId}
        vets={vets}
        medications={medications}
        defaultVetId={defaultVetId}
        defaultDate={today()}
      />
    </>
  );
}
