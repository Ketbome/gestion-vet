import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, tutors } from "@/lib/db";
import { updateTutor } from "@/lib/actions/tutors";
import { PageHeader } from "@/components/ui/page-header";
import { TutorForm } from "@/components/clientes/tutor-form";

export const metadata: Metadata = { title: "Editar cliente" };

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tutor = db
    .select()
    .from(tutors)
    .where(eq(tutors.id, Number(id)))
    .get();

  if (!tutor) notFound();

  return (
    <>
      <PageHeader title="Editar cliente" subtitle={tutor.name} />
      <TutorForm tutor={tutor} action={updateTutor.bind(null, tutor.id)} />
    </>
  );
}
