"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, vetSchedules } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type ActionState = { error?: string };

async function canManage(userId: number): Promise<boolean> {
  const me = await getCurrentUser();
  return !!me && (me.role === "admin" || me.uid === userId);
}

export async function addSchedule(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = Math.round(Number(formData.get("userId") ?? 0));
  if (!(await canManage(userId))) return { error: "No autorizado" };

  const weekday = Math.round(Number(formData.get("weekday") ?? -1));
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();

  if (weekday < 0 || weekday > 6) return { error: "Día inválido" };
  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime))
    return { error: "Horario inválido" };
  if (endTime <= startTime)
    return { error: "La hora de término debe ser mayor a la de inicio" };

  db.insert(vetSchedules)
    .values({ userId, weekday, startTime, endTime })
    .run();

  revalidatePath(`/usuarios/${userId}/horario`);
  return {};
}

export async function deleteSchedule(id: number, userId: number) {
  if (!(await canManage(userId))) redirect("/");
  db.delete(vetSchedules).where(eq(vetSchedules.id, id)).run();
  revalidatePath(`/usuarios/${userId}/horario`);
}
