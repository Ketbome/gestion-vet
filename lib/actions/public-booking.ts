"use server";

import { db, appointments } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { today } from "@/lib/dates";
import { freeSlots } from "@/lib/availability";

export type ActionState = { error?: string; ok?: boolean };

export async function requestAppointment(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const settings = getSettings();
  if (settings.clinicMode !== "completo" || !settings.publicBookingEnabled) {
    return { error: "El agendamiento en línea no está disponible." };
  }

  // Honeypot anti-spam: si viene relleno, ignorar silenciosamente
  if (String(formData.get("website") ?? "").trim()) return { ok: true };

  const tutorName = String(formData.get("tutorName") ?? "").trim();
  const tutorPhone = String(formData.get("tutorPhone") ?? "").trim() || null;
  const tutorEmail = String(formData.get("tutorEmail") ?? "").trim() || null;
  const petName = String(formData.get("petName") ?? "").trim();
  const species = String(formData.get("species") ?? "").trim() || null;
  const vetId = Number(formData.get("vetId")) || null;
  const date = String(formData.get("date") ?? "").slice(0, 10);
  const time = String(formData.get("time") ?? "").trim() || null;
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!tutorName) return { error: "Ingresa tu nombre" };
  if (!tutorPhone && !tutorEmail)
    return { error: "Ingresa un teléfono o email para confirmarte la cita" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Elige una fecha" };
  if (date < today()) return { error: "La fecha debe ser futura" };

  // Si eligió vet con horario, validar que el cupo siga libre
  if (vetId && time) {
    const slots = freeSlots(vetId, date);
    if (slots.length > 0 && !slots.includes(time))
      return { error: "Ese cupo ya no está disponible, elige otro" };
  }

  db.insert(appointments)
    .values({
      tutorName,
      tutorPhone,
      tutorEmail,
      petName,
      species,
      vetId,
      date,
      time,
      reason,
      status: "solicitada",
      source: "publica",
    })
    .run();

  return { ok: true };
}
