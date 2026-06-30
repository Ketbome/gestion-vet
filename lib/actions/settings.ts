"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, settings } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CLINIC_MODES } from "@/lib/constants";

export type ActionState = { error?: string; ok?: boolean };

export async function updateSettings(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requireRole("admin"))) return { error: "No autorizado" };

  const clinicMode = String(formData.get("clinicMode") ?? "basico");
  const clinicName = String(formData.get("clinicName") ?? "").trim();
  const publicBookingEnabled = formData.get("publicBookingEnabled") === "on";
  const bookingHoursNote =
    String(formData.get("bookingHoursNote") ?? "").trim() || null;
  const clinicRut = String(formData.get("clinicRut") ?? "").trim() || null;
  const clinicAddress = String(formData.get("clinicAddress") ?? "").trim() || null;
  const clinicPhone = String(formData.get("clinicPhone") ?? "").trim() || null;
  const clinicEmail = String(formData.get("clinicEmail") ?? "").trim() || null;
  const slotMinutes = Math.round(Number(formData.get("slotMinutes") ?? 30)) || 30;
  const ivaEnabled = formData.get("ivaEnabled") === "on";
  const ivaRate = Math.min(
    100,
    Math.max(0, Math.round(Number(formData.get("ivaRate") ?? 19)))
  );
  const logoRaw = String(formData.get("logo") ?? "");
  // El logo viaja como data URL base64; vacío = mantener, "remove" = borrar
  const logo =
    logoRaw === "remove"
      ? null
      : logoRaw.startsWith("data:image/")
        ? logoRaw
        : undefined;

  if (!(CLINIC_MODES as readonly string[]).includes(clinicMode))
    return { error: "Modo inválido" };
  if (logo && logo.length > 700_000)
    return { error: "El logo es muy pesado (máx ~500 KB)" };

  const common = {
    clinicMode,
    clinicName,
    publicBookingEnabled,
    bookingHoursNote,
    clinicRut,
    clinicAddress,
    clinicPhone,
    clinicEmail,
    slotMinutes,
    ivaEnabled,
    ivaRate,
    ...(logo !== undefined ? { logo } : {}),
  };

  db.insert(settings)
    .values({ id: 1, ...common })
    .onConflictDoUpdate({
      target: settings.id,
      set: { ...common, updatedAt: sql`(datetime('now'))` },
    })
    .run();

  revalidatePath("/", "layout");
  return { ok: true };
}
