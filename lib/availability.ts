import "server-only";

import { and, eq, ne } from "drizzle-orm";
import { db, appointments, vetSchedules, vetBlocks } from "@/lib/db";
import { getSettings } from "@/lib/settings";

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Cupos libres de un veterinario en una fecha (YYYY-MM-DD), según su horario
// semanal y las citas ya reservadas (excluye las canceladas).
export function freeSlots(vetId: number, date: string): string[] {
  if (!vetId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];

  const [y, m, d] = date.split("-").map(Number);
  // 0 = lunes … 6 = domingo
  const weekday = (new Date(y, m - 1, d).getDay() + 6) % 7;

  const blocks = db
    .select()
    .from(vetSchedules)
    .where(and(eq(vetSchedules.userId, vetId), eq(vetSchedules.weekday, weekday)))
    .all();
  if (blocks.length === 0) return [];

  // Bloqueos puntuales de esa fecha: día completo (sin horas) o rangos
  const dayBlocks = db
    .select()
    .from(vetBlocks)
    .where(and(eq(vetBlocks.userId, vetId), eq(vetBlocks.date, date)))
    .all();
  if (dayBlocks.some((b) => !b.startTime || !b.endTime)) return [];
  const blockedRanges = dayBlocks
    .filter((b) => b.startTime && b.endTime)
    .map((b) => [toMinutes(b.startTime!), toMinutes(b.endTime!)] as const);

  const step = getSettings().slotMinutes || 30;

  const taken = new Set(
    db
      .select({ time: appointments.time })
      .from(appointments)
      .where(
        and(
          eq(appointments.vetId, vetId),
          eq(appointments.date, date),
          ne(appointments.status, "cancelada")
        )
      )
      .all()
      .map((a) => a.time)
      .filter(Boolean)
  );

  const slots: string[] = [];
  for (const block of blocks) {
    for (
      let t = toMinutes(block.startTime);
      t + step <= toMinutes(block.endTime);
      t += step
    ) {
      const hhmm = toHHMM(t);
      const blocked = blockedRanges.some(
        ([start, end]) => t < end && t + step > start
      );
      if (!taken.has(hhmm) && !blocked) slots.push(hhmm);
    }
  }
  return slots.sort();
}
