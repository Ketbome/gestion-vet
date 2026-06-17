"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, petHealthRecords, pets } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { HEALTH_RECORD_TYPES } from "@/lib/constants";

export type ActionState = { error?: string; ok?: boolean };

export async function createHealthRecord(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await verifySession())) redirect("/login");

  const petId = Math.round(Number(formData.get("petId") ?? 0));
  const type = String(formData.get("type") ?? "vacuna");
  const name = String(formData.get("name") ?? "").trim();
  const appliedDate = String(formData.get("appliedDate") ?? "").slice(0, 10);
  const nextDueDate = String(formData.get("nextDueDate") ?? "").slice(0, 10) || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!Number.isInteger(petId) || petId <= 0) return { error: "Falta la mascota" };
  if (!(HEALTH_RECORD_TYPES as readonly string[]).includes(type))
    return { error: "Tipo inválido" };
  if (!name) return { error: "El nombre es obligatorio" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(appliedDate))
    return { error: "La fecha de aplicación es obligatoria" };

  const pet = db.select({ id: pets.id }).from(pets).where(eq(pets.id, petId)).get();
  if (!pet) return { error: "La mascota ya no existe" };

  db.insert(petHealthRecords)
    .values({ petId, type, name, appliedDate, nextDueDate, notes })
    .run();

  revalidatePath(`/mascotas/${petId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function deleteHealthRecord(id: number, petId: number) {
  if (!(await verifySession())) redirect("/login");

  db.delete(petHealthRecords).where(eq(petHealthRecords.id, id)).run();
  revalidatePath(`/mascotas/${petId}`);
  revalidatePath("/");
}
