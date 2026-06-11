"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, services } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export type ActionState = { error?: string };

function parseService(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const price = Math.round(Number(formData.get("price") ?? 0));
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!name) return { error: "El nombre es obligatorio" as const };
  if (!Number.isFinite(price) || price < 0)
    return { error: "El precio debe ser un número válido" as const };
  return { data: { name, price, description } };
}

export async function createService(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await verifySession())) redirect("/login");

  const parsed = parseService(formData);
  if ("error" in parsed) return { error: parsed.error };

  db.insert(services).values(parsed.data).run();
  revalidatePath("/servicios");
  redirect("/servicios");
}

export async function updateService(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await verifySession())) redirect("/login");

  const parsed = parseService(formData);
  if ("error" in parsed) return { error: parsed.error };

  db.update(services).set(parsed.data).where(eq(services.id, id)).run();
  revalidatePath("/servicios");
  redirect("/servicios");
}

export async function deleteService(id: number) {
  if (!(await verifySession())) redirect("/login");

  // Soft delete: las atenciones antiguas siguen referenciando el servicio
  db.update(services).set({ active: false }).where(eq(services.id, id)).run();
  revalidatePath("/servicios");
}
