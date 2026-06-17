import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, pets, tutors } from "@/lib/db";
import { updatePet } from "@/lib/actions/pets";
import { PageHeader } from "@/components/ui/page-header";
import { PetForm } from "@/components/clientes/pet-form";

export const metadata: Metadata = { title: "Editar mascota" };

export default async function EditarMascotaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pet = db
    .select()
    .from(pets)
    .where(eq(pets.id, Number(id)))
    .get();

  if (!pet) notFound();

  const tutor = db
    .select({ name: tutors.name })
    .from(tutors)
    .where(eq(tutors.id, pet.tutorId))
    .get();

  return (
    <>
      <PageHeader title="Editar mascota" subtitle={pet.name} />
      <PetForm
        pet={pet}
        tutorId={pet.tutorId}
        tutorName={tutor?.name ?? ""}
        action={updatePet.bind(null, pet.id)}
      />
    </>
  );
}
