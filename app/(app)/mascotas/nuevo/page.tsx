import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, tutors } from "@/lib/db";
import { createPet } from "@/lib/actions/pets";
import { PageHeader } from "@/components/ui/page-header";
import { PetForm } from "@/components/clientes/pet-form";

export const metadata: Metadata = { title: "Nueva mascota" };

export default async function NuevaMascotaPage({
  searchParams,
}: {
  searchParams: Promise<{ tutor?: string }>;
}) {
  const { tutor: tutorParam } = await searchParams;
  const tutor = db
    .select({ id: tutors.id, name: tutors.name })
    .from(tutors)
    .where(eq(tutors.id, Number(tutorParam)))
    .get();

  if (!tutor) notFound();

  return (
    <>
      <PageHeader title="Nueva mascota" subtitle={`Tutor: ${tutor.name}`} />
      <PetForm action={createPet} tutorId={tutor.id} tutorName={tutor.name} />
    </>
  );
}
