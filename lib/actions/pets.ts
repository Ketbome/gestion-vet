"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, pets, tutors } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { SPECIES, PET_SEX } from "@/lib/constants";

export type ActionState = { error?: string; ok?: boolean };

function parsePet(formData: FormData) {
  const tutorId = Math.round(Number(formData.get("tutorId") ?? 0));
  const name = String(formData.get("name") ?? "").trim();
  const species = String(formData.get("species") ?? "perro");
  const breed = String(formData.get("breed") ?? "").trim() || null;
  const sex = String(formData.get("sex") ?? "desconocido");
  const birthDate = String(formData.get("birthDate") ?? "").slice(0, 10) || null;
  const microchip = String(formData.get("microchip") ?? "").trim() || null;
  const color = String(formData.get("color") ?? "").trim() || null;
  const allergies = String(formData.get("allergies") ?? "").trim() || null;
  const sterilized = formData.get("sterilized") === "on";
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const weightKg = Number(formData.get("weightKg") ?? 0);
  const weightGrams =
    Number.isFinite(weightKg) && weightKg > 0 ? Math.round(weightKg * 1000) : null;

  if (!Number.isInteger(tutorId) || tutorId <= 0)
    return { error: "Falta el tutor" as const };
  if (!name) return { error: "El nombre de la mascota es obligatorio" as const };
  if (!(SPECIES as readonly string[]).includes(species))
    return { error: "Especie inválida" as const };
  if (!(PET_SEX as readonly string[]).includes(sex))
    return { error: "Sexo inválido" as const };

  return {
    data: {
      tutorId,
      name,
      species,
      breed,
      sex,
      birthDate,
      microchip,
      color,
      allergies,
      sterilized,
      notes,
      weightGrams,
    },
  };
}

export async function createPet(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await verifySession())) redirect("/login");

  const parsed = parsePet(formData);
  if ("error" in parsed) return { error: parsed.error };

  const owner = db
    .select({ id: tutors.id })
    .from(tutors)
    .where(eq(tutors.id, parsed.data.tutorId))
    .get();
  if (!owner) return { error: "El tutor ya no existe" };

  const pet = db.insert(pets).values(parsed.data).returning().get();
  revalidatePath(`/clientes/${parsed.data.tutorId}`);
  redirect(`/mascotas/${pet.id}`);
}

export async function updatePet(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await verifySession())) redirect("/login");

  const parsed = parsePet(formData);
  if ("error" in parsed) return { error: parsed.error };

  db.update(pets).set(parsed.data).where(eq(pets.id, id)).run();
  revalidatePath(`/mascotas/${id}`);
  revalidatePath(`/clientes/${parsed.data.tutorId}`);
  redirect(`/mascotas/${id}`);
}

export async function setNextVisit(
  petId: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await verifySession())) redirect("/login");

  const date = String(formData.get("nextVisitDate") ?? "").slice(0, 10) || null;
  const note = String(formData.get("nextVisitNote") ?? "").trim() || null;

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return { error: "Fecha inválida" };

  db.update(pets)
    .set({ nextVisitDate: date, nextVisitNote: date ? note : null })
    .where(eq(pets.id, petId))
    .run();

  revalidatePath(`/mascotas/${petId}`);
  revalidatePath("/recordatorios");
  revalidatePath("/");
  return { ok: true };
}

export async function deletePet(id: number) {
  if (!(await verifySession())) redirect("/login");

  const pet = db
    .select({ tutorId: pets.tutorId })
    .from(pets)
    .where(eq(pets.id, id))
    .get();

  db.update(pets).set({ active: false }).where(eq(pets.id, id)).run();
  if (pet) revalidatePath(`/clientes/${pet.tutorId}`);
  redirect(pet ? `/clientes/${pet.tutorId}` : "/clientes");
}
