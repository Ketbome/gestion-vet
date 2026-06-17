import type { Metadata } from "next";
import { createTutor } from "@/lib/actions/tutors";
import { PageHeader } from "@/components/ui/page-header";
import { TutorForm } from "@/components/clientes/tutor-form";

export const metadata: Metadata = { title: "Nuevo cliente" };

export default function NuevoClientePage() {
  return (
    <>
      <PageHeader title="Nuevo cliente" subtitle="Datos del tutor" />
      <TutorForm action={createTutor} />
    </>
  );
}
