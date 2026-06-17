import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  db,
  prescriptions,
  prescriptionItems,
  pets,
  tutors,
  users,
} from "@/lib/db";
import { formatDate, ageLabel } from "@/lib/dates";
import { SPECIES_LABELS, type Species } from "@/lib/constants";
import { PrintHeader } from "@/components/print/print-header";
import { PrintButton } from "@/components/print/print-button";

export const metadata: Metadata = { title: "Receta" };

export default async function RecetaPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prescription = db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.id, Number(id)))
    .get();
  if (!prescription) notFound();

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

  return (
    <>
      <div className="mb-4 flex justify-end">
        <PrintButton />
      </div>

      <PrintHeader title="Receta médica veterinaria" />

      <section className="mb-6 grid grid-cols-2 gap-2 text-sm">
        <p>
          <span className="text-gray-500">Mascota: </span>
          <strong>{pet?.name}</strong>
        </p>
        <p>
          <span className="text-gray-500">Tutor: </span>
          {tutor?.name ?? "—"}
        </p>
        <p>
          <span className="text-gray-500">Especie: </span>
          {pet ? (SPECIES_LABELS[pet.species as Species] ?? pet.species) : "—"}
          {pet?.breed ? ` · ${pet.breed}` : ""}
        </p>
        <p>
          <span className="text-gray-500">Edad: </span>
          {pet?.birthDate ? ageLabel(pet.birthDate) : "—"}
        </p>
        <p>
          <span className="text-gray-500">Fecha: </span>
          {formatDate(prescription.date)}
        </p>
      </section>

      <table className="mb-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-400 text-left">
            <th className="py-1">Medicamento</th>
            <th className="py-1">Dosis</th>
            <th className="py-1">Frecuencia</th>
            <th className="py-1">Duración</th>
            <th className="py-1">Indicaciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b border-gray-200 align-top">
              <td className="py-1.5 font-medium">{it.medication}</td>
              <td className="py-1.5">{it.dose ?? "—"}</td>
              <td className="py-1.5">{it.frequency ?? "—"}</td>
              <td className="py-1.5">{it.duration ?? "—"}</td>
              <td className="py-1.5">{it.instructions ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {prescription.notes && (
        <section className="mb-10 text-sm">
          <p className="font-semibold text-gray-700">Indicaciones generales</p>
          <p className="whitespace-pre-wrap text-gray-700">{prescription.notes}</p>
        </section>
      )}

      <footer className="mt-16 text-center text-sm">
        <div className="mx-auto w-64 border-t border-gray-500 pt-1">
          {vet?.name ?? "Médico veterinario"}
        </div>
      </footer>
    </>
  );
}
