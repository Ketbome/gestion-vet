import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";
import { db, settings, type Settings } from "@/lib/db";
import type { ClinicMode } from "@/lib/constants";

// Singleton: una sola fila (id = 1). Si no existe se crea con los valores por
// defecto, de modo que las instalaciones existentes arrancan en modo básico.
export const getSettings = cache((): Settings => {
  const existing = db.select().from(settings).where(eq(settings.id, 1)).get();
  if (existing) return existing;
  return db.insert(settings).values({ id: 1 }).returning().get();
});

export function getClinicMode(): ClinicMode {
  return getSettings().clinicMode === "completo" ? "completo" : "basico";
}

export function isCompleteMode(): boolean {
  return getClinicMode() === "completo";
}
