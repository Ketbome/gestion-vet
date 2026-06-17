"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, tutors } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export type ActionState = { error?: string };

function parseTutor(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const rut = String(formData.get("rut") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) return { error: "El nombre es obligatorio" as const };
  if (!phone && !email)
    return { error: "Ingresa al menos un teléfono o email" as const };

  return { data: { name, phone, email, rut, address, notes } };
}

export async function createTutor(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await verifySession())) redirect("/login");

  const parsed = parseTutor(formData);
  if ("error" in parsed) return { error: parsed.error };

  const tutor = db.insert(tutors).values(parsed.data).returning().get();
  revalidatePath("/clientes");
  redirect(`/clientes/${tutor.id}`);
}

export async function updateTutor(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await verifySession())) redirect("/login");

  const parsed = parseTutor(formData);
  if ("error" in parsed) return { error: parsed.error };

  db.update(tutors).set(parsed.data).where(eq(tutors.id, id)).run();
  revalidatePath("/clientes");
  redirect(`/clientes/${id}`);
}

export async function deleteTutor(id: number) {
  if (!(await verifySession())) redirect("/login");

  // Soft delete: las atenciones y mascotas antiguas siguen referenciándolo
  db.update(tutors).set({ active: false }).where(eq(tutors.id, id)).run();
  revalidatePath("/clientes");
  redirect("/clientes");
}
