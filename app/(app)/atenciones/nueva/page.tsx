import type { Metadata } from "next";
import { and, asc, eq } from "drizzle-orm";
import { db, appointments, pets, products, services, tutors, users } from "@/lib/db";
import { createAttention } from "@/lib/actions/attentions";
import { today } from "@/lib/dates";
import { getClinicMode } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { AttentionForm } from "@/components/atenciones/attention-form";

export const metadata: Metadata = { title: "Nueva atención" };

export default async function NuevaAtencionPage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string; appointment?: string }>;
}) {
  const { pet: petParam, appointment: appointmentParam } = await searchParams;
  const mode = getClinicMode();

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

  let tutorOptions: { id: number; name: string; phone: string | null }[] = [];
  let petOptions: { id: number; tutorId: number; name: string; species: string }[] = [];
  let vetOptions: { id: number; name: string }[] = [];
  let defaultVetId: number | undefined;
  let defaultPet:
    | { id: number; name: string; tutorId: number; tutorName: string }
    | undefined;

  if (mode === "completo") {
    vetOptions = db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(and(eq(users.active, true), eq(users.role, "veterinario")))
      .orderBy(asc(users.name))
      .all();
    const me = await getCurrentUser();
    if (me?.role === "veterinario") defaultVetId = me.uid;

    tutorOptions = db
      .select({ id: tutors.id, name: tutors.name, phone: tutors.phone })
      .from(tutors)
      .where(eq(tutors.active, true))
      .orderBy(asc(tutors.name))
      .all();

    petOptions = db
      .select({
        id: pets.id,
        tutorId: pets.tutorId,
        name: pets.name,
        species: pets.species,
      })
      .from(pets)
      .where(eq(pets.active, true))
      .orderBy(asc(pets.name))
      .all();

    const petId = Number(petParam) || null;
    if (petId) {
      const row = db
        .select({
          id: pets.id,
          name: pets.name,
          tutorId: pets.tutorId,
          tutorName: tutors.name,
        })
        .from(pets)
        .innerJoin(tutors, eq(pets.tutorId, tutors.id))
        .where(eq(pets.id, petId))
        .get();
      if (row) defaultPet = row;
    }
  }

  // Si viene desde una cita, prefijar la mascota cuando exista
  const appointmentId = Number(appointmentParam) || undefined;
  if (appointmentId && mode === "completo" && !defaultPet) {
    const appt = db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .get();
    if (appt?.petId) {
      const row = db
        .select({
          id: pets.id,
          name: pets.name,
          tutorId: pets.tutorId,
          tutorName: tutors.name,
        })
        .from(pets)
        .innerJoin(tutors, eq(pets.tutorId, tutors.id))
        .where(eq(pets.id, appt.petId))
        .get();
      if (row) defaultPet = row;
    }
  }

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
        mode={mode}
        tutors={tutorOptions}
        pets={petOptions}
        vets={vetOptions}
        defaultPet={defaultPet}
        defaultVetId={defaultVetId}
        appointmentId={appointmentId}
      />
    </>
  );
}
