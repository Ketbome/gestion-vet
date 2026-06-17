import { eq } from "drizzle-orm";
import { db, attentions, pets, tutors, users } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { formatDate, ageLabel } from "@/lib/dates";
import { SPECIES_LABELS, type Species } from "@/lib/constants";
import { startPdf, pdfResponse } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function wrap(text: string, max = 95): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      lines.push(line.trim());
      line = w;
    } else {
      line = `${line} ${w}`;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) return new Response("No autorizado", { status: 401 });

  const { id } = await params;
  const attention = db
    .select()
    .from(attentions)
    .where(eq(attentions.id, Number(id)))
    .get();
  if (!attention) return new Response("No encontrado", { status: 404 });

  const pet = attention.petId
    ? db.select().from(pets).where(eq(pets.id, attention.petId)).get()
    : null;
  const tutor = attention.tutorId
    ? db.select().from(tutors).where(eq(tutors.id, attention.tutorId)).get()
    : null;
  const vet = attention.vetId
    ? db.select().from(users).where(eq(users.id, attention.vetId)).get()
    : null;

  const petName = pet?.name ?? attention.petName;
  const speciesLabel = pet ? SPECIES_LABELS[pet.species as Species] ?? pet.species : "";
  const ownerName = tutor?.name ?? attention.ownerName;

  const custom = new URL(req.url).searchParams.get("obs");
  const text =
    custom ||
    `Certifico que ${petName}${speciesLabel ? `, ${speciesLabel.toLowerCase()}` : ""}${
      pet?.breed ? ` raza ${pet.breed}` : ""
    }${pet?.birthDate ? `, de ${ageLabel(pet.birthDate)}` : ""}, de propiedad de ${ownerName}, fue examinado(a) en esta fecha y se encuentra clínicamente sano(a)${
      attention.diagnosis ? `. Observaciones: ${attention.diagnosis}` : "."
    }`;

  const ctx = await startPdf("Certificado de salud");

  ctx.text(formatDate(attention.date), { color: "gray" });
  ctx.gap(12);
  for (const line of wrap(text)) ctx.text(line, { gap: 4 });

  ctx.gap(70);
  ctx.hr();
  ctx.text(vet?.name ?? "Médico veterinario", { bold: true });

  return pdfResponse(await ctx.bytes(), `certificado-${petName}.pdf`);
}
