import { and, asc, eq } from "drizzle-orm";
import { db, pets, petHealthRecords, tutors } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { formatDate, ageLabel } from "@/lib/dates";
import { SPECIES_LABELS, PET_SEX_LABELS, type Species, type PetSex } from "@/lib/constants";
import { startPdf, pdfResponse } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) return new Response("No autorizado", { status: 401 });

  const { id } = await params;
  const pet = db.select().from(pets).where(eq(pets.id, Number(id))).get();
  if (!pet) return new Response("No encontrado", { status: 404 });

  const tutor = db.select().from(tutors).where(eq(tutors.id, pet.tutorId)).get();
  const records = db
    .select()
    .from(petHealthRecords)
    .where(and(eq(petHealthRecords.petId, pet.id), eq(petHealthRecords.type, "vacuna")))
    .orderBy(asc(petHealthRecords.appliedDate))
    .all();

  const ctx = await startPdf("Carnet de vacunación");

  ctx.text(`Mascota: ${pet.name}`, { bold: true });
  ctx.text(`Tutor: ${tutor?.name ?? "-"}`);
  ctx.text(
    `Especie: ${SPECIES_LABELS[pet.species as Species] ?? pet.species}${
      pet.breed ? ` - ${pet.breed}` : ""
    }   Sexo: ${PET_SEX_LABELS[pet.sex as PetSex]}`
  );
  if (pet.birthDate) ctx.text(`Edad: ${ageLabel(pet.birthDate)}`);
  if (pet.microchip) ctx.text(`Microchip: ${pet.microchip}`);
  ctx.gap(8);
  ctx.hr();
  ctx.gap(2);

  ctx.row(
    [
      { text: "Vacuna", x: ctx.margin, bold: true },
      { text: "Aplicación", x: 300, bold: true },
      { text: "Próxima", x: 420, bold: true },
    ],
    8
  );
  if (records.length === 0) {
    ctx.text("Sin vacunas registradas.", { color: "gray" });
  } else {
    for (const r of records) {
      ctx.row([
        { text: r.name, x: ctx.margin },
        { text: formatDate(r.appliedDate), x: 300 },
        { text: r.nextDueDate ? formatDate(r.nextDueDate) : "-", x: 420 },
      ]);
    }
  }

  return pdfResponse(await ctx.bytes(), `carnet-${pet.name}.pdf`);
}
