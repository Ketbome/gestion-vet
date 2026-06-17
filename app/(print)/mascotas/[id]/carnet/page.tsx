import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db, pets, petHealthRecords, tutors } from "@/lib/db";
import { formatDate, ageLabel } from "@/lib/dates";
import {
  SPECIES_LABELS,
  PET_SEX_LABELS,
  HEALTH_RECORD_TYPE_LABELS,
  type Species,
  type PetSex,
  type HealthRecordType,
} from "@/lib/constants";
import { PrintHeader } from "@/components/print/print-header";
import { PrintButton } from "@/components/print/print-button";

export const metadata: Metadata = { title: "Carnet" };

export default async function CarnetPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pet = db.select().from(pets).where(eq(pets.id, Number(id))).get();
  if (!pet) notFound();

  const tutor = db.select().from(tutors).where(eq(tutors.id, pet.tutorId)).get();
  const records = db
    .select()
    .from(petHealthRecords)
    .where(
      and(
        eq(petHealthRecords.petId, pet.id),
        eq(petHealthRecords.type, "vacuna")
      )
    )
    .orderBy(asc(petHealthRecords.appliedDate))
    .all();

  return (
    <>
      <div className="mb-4 flex justify-end">
        <PrintButton />
      </div>

      <PrintHeader title="Carnet de vacunación" />

      <section className="mb-6 grid grid-cols-2 gap-2 text-sm">
        <p>
          <span className="text-gray-500">Mascota: </span>
          <strong>{pet.name}</strong>
        </p>
        <p>
          <span className="text-gray-500">Tutor: </span>
          {tutor?.name ?? "—"}
        </p>
        <p>
          <span className="text-gray-500">Especie: </span>
          {SPECIES_LABELS[pet.species as Species] ?? pet.species}
          {pet.breed ? ` · ${pet.breed}` : ""}
        </p>
        <p>
          <span className="text-gray-500">Sexo: </span>
          {PET_SEX_LABELS[pet.sex as PetSex]}
        </p>
        <p>
          <span className="text-gray-500">Edad: </span>
          {pet.birthDate ? ageLabel(pet.birthDate) : "—"}
        </p>
        {pet.microchip && (
          <p>
            <span className="text-gray-500">Microchip: </span>
            {pet.microchip}
          </p>
        )}
      </section>

      {records.length === 0 ? (
        <p className="text-sm text-gray-500">Sin vacunas registradas.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-400 text-left">
              <th className="py-1">Vacuna</th>
              <th className="py-1">Tipo</th>
              <th className="py-1">Aplicación</th>
              <th className="py-1">Próxima dosis</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b border-gray-200">
                <td className="py-1.5 font-medium">{r.name}</td>
                <td className="py-1.5">
                  {HEALTH_RECORD_TYPE_LABELS[r.type as HealthRecordType] ?? r.type}
                </td>
                <td className="py-1.5">{formatDate(r.appliedDate)}</td>
                <td className="py-1.5">
                  {r.nextDueDate ? formatDate(r.nextDueDate) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
