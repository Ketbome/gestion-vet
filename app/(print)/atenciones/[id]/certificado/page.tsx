import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, attentions, pets, tutors, users } from "@/lib/db";
import { formatDate, ageLabel } from "@/lib/dates";
import { SPECIES_LABELS, type Species } from "@/lib/constants";
import { PrintHeader } from "@/components/print/print-header";
import { PrintButton } from "@/components/print/print-button";
import { CertificateText } from "@/components/print/certificate-text";

export const metadata: Metadata = { title: "Certificado" };

export default async function CertificadoPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const attention = db
    .select()
    .from(attentions)
    .where(eq(attentions.id, Number(id)))
    .get();
  if (!attention) notFound();

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
  const speciesLabel = pet
    ? SPECIES_LABELS[pet.species as Species] ?? pet.species
    : "";
  const ownerName = tutor?.name ?? attention.ownerName;

  const defaultText = `Certifico que ${petName}${
    speciesLabel ? `, ${speciesLabel.toLowerCase()}` : ""
  }${pet?.breed ? ` raza ${pet.breed}` : ""}${
    pet?.birthDate ? `, de ${ageLabel(pet.birthDate)}` : ""
  }, de propiedad de ${ownerName}, fue examinado(a) en esta fecha y se encuentra clínicamente sano(a)${
    attention.diagnosis ? `. Observaciones: ${attention.diagnosis}` : "."
  }`;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <PrintButton />
      </div>

      <PrintHeader title="Certificado de salud" />

      <p className="text-sm text-gray-500">{formatDate(attention.date)}</p>

      <CertificateText defaultText={defaultText} />

      <footer className="mt-16 text-center text-sm">
        <div className="mx-auto w-64 border-t border-gray-500 pt-1">
          {vet?.name ?? "Médico veterinario"}
        </div>
      </footer>
    </>
  );
}
