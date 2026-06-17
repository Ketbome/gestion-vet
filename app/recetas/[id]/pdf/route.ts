import { eq } from "drizzle-orm";
import {
  db,
  prescriptions,
  prescriptionItems,
  pets,
  tutors,
  users,
} from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { formatDate, ageLabel } from "@/lib/dates";
import { SPECIES_LABELS, type Species } from "@/lib/constants";
import { startPdf, pdfResponse } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) return new Response("No autorizado", { status: 401 });

  const { id } = await params;
  const prescription = db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.id, Number(id)))
    .get();
  if (!prescription) return new Response("No encontrado", { status: 404 });

  const pet = db.select().from(pets).where(eq(pets.id, prescription.petId)).get();
  const tutor = prescription.tutorId
    ? db.select().from(tutors).where(eq(tutors.id, prescription.tutorId)).get()
    : null;
  const vet = prescription.vetId
    ? db.select().from(users).where(eq(users.id, prescription.vetId)).get()
    : null;
  const items = db
    .select()
    .from(prescriptionItems)
    .where(eq(prescriptionItems.prescriptionId, prescription.id))
    .all();

  const ctx = await startPdf("Receta médica veterinaria");

  ctx.text(`Mascota: ${pet?.name ?? "-"}`, { bold: true });
  ctx.text(`Tutor: ${tutor?.name ?? "-"}`);
  ctx.text(
    `Especie: ${
      pet ? (SPECIES_LABELS[pet.species as Species] ?? pet.species) : "-"
    }${pet?.breed ? ` - ${pet.breed}` : ""}`
  );
  if (pet?.birthDate) ctx.text(`Edad: ${ageLabel(pet.birthDate)}`);
  ctx.text(`Fecha: ${formatDate(prescription.date)}`);
  ctx.gap(8);
  ctx.hr();
  ctx.gap(4);

  for (const it of items) {
    const detail = [it.dose, it.frequency, it.duration].filter(Boolean).join(" - ");
    ctx.text(`- ${it.medication}`, { bold: true, gap: 3 });
    if (detail) ctx.text(`   ${detail}`, { color: "gray", size: 9 });
    if (it.instructions) ctx.text(`   ${it.instructions}`, { color: "gray", size: 9 });
    ctx.gap(4);
  }

  if (prescription.notes) {
    ctx.gap(6);
    ctx.text("Indicaciones generales:", { bold: true });
    ctx.text(prescription.notes, { color: "gray" });
  }

  ctx.gap(60);
  ctx.hr();
  ctx.text(vet?.name ?? "Médico veterinario", { bold: true });

  return pdfResponse(await ctx.bytes(), `receta-${prescription.id}.pdf`);
}
