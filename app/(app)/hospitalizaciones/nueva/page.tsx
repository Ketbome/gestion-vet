import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, pets, tutors } from "@/lib/db";
import { getClinicMode } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { today } from "@/lib/dates";
import { createHospitalization } from "@/lib/actions/hospitalizations";
import { getSchedulableVets } from "@/lib/queries/vets";
import { PageHeader } from "@/components/ui/page-header";
import { HospitalizationForm } from "@/components/hospitalizaciones/hospitalization-form";

export const metadata: Metadata = { title: "Hospitalizar" };

export default async function NuevaHospitalizacionPage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string }>;
}) {
  if (getClinicMode() !== "completo") redirect("/");

  const { pet: petParam } = await searchParams;

  const petOptions = db
    .select({ id: pets.id, name: pets.name, tutorName: tutors.name })
    .from(pets)
    .innerJoin(tutors, eq(pets.tutorId, tutors.id))
    .where(eq(pets.active, true))
    .orderBy(asc(pets.name))
    .all();

  const vetOptions = getSchedulableVets();

  const me = await getCurrentUser();
  const defaultVetId =
    me && vetOptions.some((v) => v.id === me.uid) ? me.uid : undefined;

  const petId = Number(petParam) || null;
  const defaultPet = petId
    ? petOptions.find((p) => p.id === petId)
      ? { id: petId, name: petOptions.find((p) => p.id === petId)!.name }
      : undefined
    : undefined;

  return (
    <>
      <PageHeader title="Hospitalizar" subtitle="Registra el ingreso del paciente" />
      <HospitalizationForm
        pets={petOptions}
        vets={vetOptions}
        defaultDate={today()}
        defaultPet={defaultPet}
        defaultVetId={defaultVetId}
        action={createHospitalization}
      />
    </>
  );
}
