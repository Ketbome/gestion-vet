import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db, attentions, pets, petHealthRecords, prescriptions, tutors } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { formatDate, ageLabel, today } from "@/lib/dates";
import {
  SPECIES_LABELS,
  PET_SEX_LABELS,
  HEALTH_RECORD_TYPE_LABELS,
  type Species,
  type PetSex,
  type HealthRecordType,
} from "@/lib/constants";
import { deletePet } from "@/lib/actions/pets";
import { deleteHealthRecord } from "@/lib/actions/health";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { DeleteButton } from "@/components/ui/delete-button";
import { HealthRecordForm } from "@/components/clientes/health-record-form";

export const metadata: Metadata = { title: "Mascota" };

function fmtKg(grams: number) {
  return `${(grams / 1000).toLocaleString("es-CL", { maximumFractionDigits: 2 })} kg`;
}

export default async function MascotaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const petId = Number(id);
  const pet = db.select().from(pets).where(eq(pets.id, petId)).get();

  if (!pet) notFound();

  const tutor = db.select().from(tutors).where(eq(tutors.id, pet.tutorId)).get();

  const history = db
    .select()
    .from(attentions)
    .where(eq(attentions.petId, petId))
    .orderBy(desc(attentions.date), desc(attentions.id))
    .all();

  const weights = db
    .select({ date: attentions.date, weightGrams: attentions.weightGrams })
    .from(attentions)
    .where(and(eq(attentions.petId, petId), isNotNull(attentions.weightGrams)))
    .orderBy(attentions.date)
    .all();

  const records = db
    .select()
    .from(petHealthRecords)
    .where(eq(petHealthRecords.petId, petId))
    .orderBy(desc(petHealthRecords.appliedDate))
    .all();

  const recetas = db
    .select({ id: prescriptions.id, date: prescriptions.date })
    .from(prescriptions)
    .where(eq(prescriptions.petId, petId))
    .orderBy(desc(prescriptions.date))
    .all();

  const todayIso = today();
  const facts = [
    SPECIES_LABELS[pet.species as Species] ?? pet.species,
    pet.breed,
    PET_SEX_LABELS[pet.sex as PetSex],
    pet.birthDate ? ageLabel(pet.birthDate) : null,
    pet.sterilized ? "Esterilizado/a" : null,
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        title={pet.name}
        subtitle={facts.join(" · ")}
        action={
          <div className="flex items-center gap-2">
            <a
              href={`/mascotas/${pet.id}/carnet/pdf`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Carnet PDF
            </a>
            <ButtonLink href={`/mascotas/${pet.id}/editar`} variant="secondary">
              Editar
            </ButtonLink>
            <DeleteButton
              action={deletePet.bind(null, pet.id)}
              confirmTitle="¿Eliminar mascota?"
              confirmMessage="Se ocultará la mascota. Su historial de atenciones se conserva."
            />
          </div>
        }
      />

      <div className="max-w-2xl space-y-4">
        <Card className="space-y-1.5 p-5 text-sm text-gray-600">
          {tutor && (
            <p>
              <span className="text-gray-400">Tutor: </span>
              <Link
                href={`/clientes/${tutor.id}`}
                className="font-medium text-primary-600 hover:underline"
              >
                {tutor.name}
              </Link>
              {tutor.phone ? ` · ${tutor.phone}` : ""}
            </p>
          )}
          {pet.weightGrams != null && (
            <p>
              <span className="text-gray-400">Peso actual: </span>
              {fmtKg(pet.weightGrams)}
            </p>
          )}
          {pet.microchip && (
            <p>
              <span className="text-gray-400">Microchip: </span>
              {pet.microchip}
            </p>
          )}
          {pet.notes && <p className="whitespace-pre-wrap">{pet.notes}</p>}
        </Card>

        {weights.length > 0 && (
          <Card className="p-5">
            <h2 className="mb-3 font-semibold text-gray-900">Evolución de peso</h2>
            <WeightChart
              points={weights.map((w) => ({
                date: w.date,
                grams: w.weightGrams as number,
              }))}
            />
          </Card>
        )}

        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Vacunas y antiparasitarios</h2>
          </div>
          {records.length === 0 ? (
            <p className="text-sm text-gray-400">Aún no hay registros.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {records.map((r) => {
                const overdue = r.nextDueDate && r.nextDueDate < todayIso;
                return (
                  <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {r.name}
                        <span className="ml-2 text-xs font-normal text-gray-400">
                          {HEALTH_RECORD_TYPE_LABELS[r.type as HealthRecordType] ?? r.type}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Aplicado {formatDate(r.appliedDate)}
                        {r.nextDueDate && (
                          <>
                            {" · "}
                            <span className={overdue ? "text-red-600" : "text-gray-500"}>
                              próxima {formatDate(r.nextDueDate)}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <DeleteButton
                      action={deleteHealthRecord.bind(null, r.id, petId)}
                      confirmTitle="¿Eliminar registro?"
                    />
                  </li>
                );
              })}
            </ul>
          )}
          <HealthRecordForm key={records.length} petId={petId} today={todayIso} />
        </Card>

        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recetas</h2>
            <ButtonLink href={`/recetas/nueva?pet=${pet.id}`} variant="secondary">
              + Nueva receta
            </ButtonLink>
          </div>
          {recetas.length === 0 ? (
            <p className="text-sm text-gray-400">Sin recetas emitidas.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recetas.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 py-2 text-sm"
                >
                  <span className="text-gray-700">Receta {formatDate(r.date)}</span>
                  <a
                    href={`/recetas/${r.id}/pdf`}
                    className="font-medium text-primary-600 hover:underline"
                  >
                    Descargar PDF
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Historial clínico</h2>
            <ButtonLink href={`/atenciones/nueva?pet=${pet.id}`}>
              + Nueva atención
            </ButtonLink>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400">Sin atenciones registradas.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {history.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/atenciones/${a.id}`}
                    className="flex items-center justify-between gap-2 py-2 text-sm hover:bg-gray-50"
                  >
                    <span className="min-w-0 truncate text-gray-700">
                      {formatDate(a.date)}
                      {a.weightGrams != null && (
                        <span className="text-gray-400"> · {fmtKg(a.weightGrams)}</span>
                      )}
                    </span>
                    <span className="shrink-0 font-semibold text-primary-700 tabular-nums">
                      {formatCurrency(a.total)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function WeightChart({ points }: { points: { date: string; grams: number }[] }) {
  const max = Math.max(...points.map((p) => p.grams));
  const min = Math.min(...points.map((p) => p.grams));
  const span = max - min || 1;
  return (
    <ul className="space-y-2">
      {points.map((p, i) => (
        <li key={i} className="flex items-center gap-3 text-sm">
          <span className="w-20 shrink-0 text-xs text-gray-500">{formatDate(p.date)}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-primary-500"
              style={{ width: `${20 + ((p.grams - min) / span) * 80}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right font-medium text-gray-900 tabular-nums">
            {(p.grams / 1000).toLocaleString("es-CL", { maximumFractionDigits: 2 })} kg
          </span>
        </li>
      ))}
    </ul>
  );
}
