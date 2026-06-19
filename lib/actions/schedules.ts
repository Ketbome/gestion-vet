"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, vetSchedules, vetBlocks } from "@/lib/db";
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

export async function addBlock(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = Math.round(Number(formData.get("userId") ?? 0));
  if (!(await canManage(userId))) return { error: "No autorizado" };

  const date = String(formData.get("date") ?? "").slice(0, 10);
  const allDay = formData.get("allDay") === "on";
  const startTime = allDay ? null : String(formData.get("startTime") ?? "").trim() || null;
  const endTime = allDay ? null : String(formData.get("endTime") ?? "").trim() || null;
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Fecha inválida" };
  if (!allDay) {
    if (!startTime || !endTime)
      return { error: "Indica el rango de horas o marca el día completo" };
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime))
      return { error: "Horario inválido" };
    if (endTime <= startTime)
      return { error: "La hora de término debe ser mayor a la de inicio" };
  }

  db.insert(vetBlocks).values({ userId, date, startTime, endTime, reason }).run();

  revalidatePath(`/usuarios/${userId}/horario`);
  revalidatePath("/agenda");
  return {};
}

export async function deleteBlock(id: number, userId: number) {
  if (!(await canManage(userId))) redirect("/");
  db.delete(vetBlocks).where(eq(vetBlocks.id, id)).run();
  revalidatePath(`/usuarios/${userId}/horario`);
  revalidatePath("/agenda");
}
