import type { Metadata } from "next";
import { and, asc, eq } from "drizzle-orm";
import { db, pets, tutors, users } from "@/lib/db";
import { today } from "@/lib/dates";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { AppointmentForm } from "@/components/agenda/appointment-form";

export const metadata: Metadata = { title: "Nueva cita" };

export default async function NuevaCitaPage() {
  const tutorOptions = db
    .select({ id: tutors.id, name: tutors.name, phone: tutors.phone })
    .from(tutors)
    .where(eq(tutors.active, true))
    .orderBy(asc(tutors.name))
    .all();

  const petOptions = db
    .select({ id: pets.id, tutorId: pets.tutorId, name: pets.name })
    .from(pets)
    .where(eq(pets.active, true))
    .orderBy(asc(pets.name))
    .all();

  const vetOptions = db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.active, true), eq(users.role, "veterinario")))
    .orderBy(asc(users.name))
    .all();

  const me = await getCurrentUser();
  const defaultVetId = me?.role === "veterinario" ? me.uid : undefined;

  return (
    <>
      <PageHeader title="Nueva cita" subtitle="Agenda una cita interna" />
      <AppointmentForm
        tutors={tutorOptions}
        pets={petOptions}
        vets={vetOptions}
        defaultDate={today()}
        defaultVetId={defaultVetId}
      />
    </>
  );
}
