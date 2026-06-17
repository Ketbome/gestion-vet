"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, prescriptions, prescriptionItems, pets, products } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export type ActionState = { error?: string };

type ItemInput = {
  medication: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
};

function parseItems(raw: string): ItemInput[] | null {
  try {
    const parsed = JSON.parse(raw) as ItemInput[];
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((i) => i.medication?.trim());
  } catch {
    return null;
  }
}

export async function createPrescription(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const me = await verifySession();
  if (!me) redirect("/login");
  if (me.role === "recepcion")
    return { error: "No tienes permiso para emitir recetas" };

  const petId = Number(formData.get("petId")) || null;
  const attentionId = Number(formData.get("attentionId")) || null;
  const vetId = Number(formData.get("vetId")) || me.uid;
  const date = String(formData.get("date") ?? "").slice(0, 10);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const items = parseItems(String(formData.get("items") ?? ""));

  if (!petId) return { error: "Falta la mascota" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "La fecha es obligatoria" };
  if (!items || items.length === 0)
    return { error: "Agrega al menos un medicamento" };

  const pet = db.select().from(pets).where(eq(pets.id, petId)).get();
  if (!pet) return { error: "La mascota ya no existe" };

  const created = db.transaction((tx) => {
    // Medicamentos nuevos se agregan al catálogo (solo autocomplete, sin stock)
    for (const name of new Set(items.map((i) => i.medication.trim()))) {
      const exists = tx
        .select({ id: products.id })
        .from(products)
        .where(sql`lower(${products.name}) = ${name.toLowerCase()}`)
        .get();
      if (!exists) {
        tx.insert(products)
          .values({ name, category: "medicamento", tracked: false })
          .run();
      }
    }

    const prescription = tx
      .insert(prescriptions)
      .values({ petId, tutorId: pet.tutorId, vetId, attentionId, date, notes })
      .returning()
      .get();

    tx.insert(prescriptionItems)
      .values(
        items.map((i) => ({
          prescriptionId: prescription.id,
          medication: i.medication.trim(),
          dose: i.dose?.trim() || null,
          frequency: i.frequency?.trim() || null,
          duration: i.duration?.trim() || null,
          instructions: i.instructions?.trim() || null,
        }))
      )
      .run();

    return prescription;
  });

  revalidatePath(`/mascotas/${petId}`);
  revalidatePath("/inventario");
  if (attentionId) revalidatePath(`/atenciones/${attentionId}`);
  redirect(`/recetas/${created.id}`);
}

export async function deletePrescription(id: number) {
  const me = await verifySession();
  if (!me) redirect("/login");
  if (me.role === "recepcion") redirect("/");

  const presc = db
    .select({ petId: prescriptions.petId, attentionId: prescriptions.attentionId })
    .from(prescriptions)
    .where(eq(prescriptions.id, id))
    .get();

  db.delete(prescriptions).where(eq(prescriptions.id, id)).run();

  if (presc) {
    revalidatePath(`/mascotas/${presc.petId}`);
    if (presc.attentionId) revalidatePath(`/atenciones/${presc.attentionId}`);
  }
}
