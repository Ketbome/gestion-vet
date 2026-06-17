"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, appointments, pets, tutors } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export type ActionState = { error?: string };

function slotTaken(vetId: number, date: string, time: string): boolean {
  return !!db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.vetId, vetId),
        eq(appointments.date, date),
        eq(appointments.time, time),
        ne(appointments.status, "cancelada")
      )
    )
    .get();
}

export async function createAppointment(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await verifySession())) redirect("/login");

  const petId = Number(formData.get("petId")) || null;
  let tutorId = Number(formData.get("tutorId")) || null;
  const vetId = Number(formData.get("vetId")) || null;
  const date = String(formData.get("date") ?? "").slice(0, 10);
  const time = String(formData.get("time") ?? "").trim() || null;
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "La fecha es obligatoria" };
  if (vetId && time && slotTaken(vetId, date, time))
    return { error: "Ese cupo ya está reservado" };

  let petName = "";
  let tutorName = "";
  let tutorPhone: string | null = null;
  let tutorEmail: string | null = null;
  let species: string | null = null;

  if (petId) {
    const pet = db.select().from(pets).where(eq(pets.id, petId)).get();
    if (!pet) return { error: "La mascota ya no existe" };
    petName = pet.name;
    species = pet.species;
    tutorId = pet.tutorId;
    const owner = db.select().from(tutors).where(eq(tutors.id, pet.tutorId)).get();
    if (owner) {
      tutorName = owner.name;
      tutorPhone = owner.phone;
      tutorEmail = owner.email;
    }
  } else if (tutorId) {
    const owner = db.select().from(tutors).where(eq(tutors.id, tutorId)).get();
    if (owner) {
      tutorName = owner.name;
      tutorPhone = owner.phone;
      tutorEmail = owner.email;
    }
  }

  db.insert(appointments)
    .values({
      tutorId,
      petId,
      vetId,
      durationMin: getSettings().slotMinutes,
      tutorName,
      tutorPhone,
      tutorEmail,
      petName,
      species,
      date,
      time,
      reason,
      notes,
      status: "confirmada",
      source: "interna",
      confirmedAt: sql`(datetime('now'))`,
    })
    .run();

  revalidatePath("/agenda");
  revalidatePath("/");
  redirect("/agenda");
}

export async function confirmAppointment(id: number) {
  if (!(await verifySession())) redirect("/login");
  db.update(appointments)
    .set({ status: "confirmada", confirmedAt: sql`(datetime('now'))` })
    .where(eq(appointments.id, id))
    .run();
  revalidatePath("/agenda");
  revalidatePath("/");
}

export async function cancelAppointment(id: number) {
  if (!(await verifySession())) redirect("/login");
  db.update(appointments)
    .set({ status: "cancelada" })
    .where(eq(appointments.id, id))
    .run();
  revalidatePath("/agenda");
  revalidatePath("/");
}
