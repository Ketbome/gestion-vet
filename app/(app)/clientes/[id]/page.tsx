import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, attentions, pets, tutors } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { SPECIES_LABELS, type Species } from "@/lib/constants";
import { deleteTutor } from "@/lib/actions/tutors";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";

export const metadata: Metadata = { title: "Cliente" };

export default async function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tutorId = Number(id);
  const tutor = db.select().from(tutors).where(eq(tutors.id, tutorId)).get();

  if (!tutor) notFound();

  const petList = db
    .select()
    .from(pets)
    .where(and(eq(pets.tutorId, tutorId), eq(pets.active, true)))
    .orderBy(asc(pets.name))
    .all();

  const debts = db
    .select({
      id: attentions.id,
      petName: attentions.petName,
      date: attentions.date,
      total: attentions.total,
      paid: sql<number>`coalesce((select sum(amount) from payments where attention_id = ${attentions.id}), 0)`,
    })
    .from(attentions)
    .where(eq(attentions.tutorId, tutorId))
    .orderBy(desc(attentions.date))
    .all()
    .map((a) => ({ ...a, remaining: a.total - a.paid }))
    .filter((a) => a.remaining > 0);

  const totalDebt = debts.reduce((sum, d) => sum + d.remaining, 0);

  return (
    <>
      <PageHeader
        title={tutor.name}
        subtitle={[tutor.phone, tutor.email].filter(Boolean).join(" · ") || undefined}
        backHref="/clientes"
        backLabel="Clientes"
        action={
          <div className="flex items-center gap-2">
            <ButtonLink href={`/clientes/${tutor.id}/editar`} variant="secondary">
              Editar
            </ButtonLink>
            <DeleteButton
              action={deleteTutor.bind(null, tutor.id)}
              confirmTitle="¿Eliminar cliente?"
              confirmMessage="Se ocultará el cliente. Su historial de atenciones se conserva."
            />
          </div>
        }
      />

      <div className="max-w-2xl space-y-4">
        {(tutor.rut || tutor.address || tutor.notes) && (
          <Card className="space-y-1.5 p-5 text-sm text-gray-600">
            {tutor.rut && (
              <p>
                <span className="text-gray-400">RUT: </span>
                {tutor.rut}
              </p>
            )}
            {tutor.address && (
              <p>
                <span className="text-gray-400">Dirección: </span>
                {tutor.address}
              </p>
            )}
            {tutor.notes && <p className="whitespace-pre-wrap">{tutor.notes}</p>}
          </Card>
        )}

        {totalDebt > 0 && (
          <Card className="border-red-200 bg-red-50 p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold text-red-800">Saldo pendiente</h2>
              <span className="text-lg font-bold text-red-700 tabular-nums">
                {formatCurrency(totalDebt)}
              </span>
            </div>
            <ul className="space-y-1">
              {debts.map((d) => (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/atenciones/${d.id}`}
                    className="text-red-900 hover:underline"
                  >
                    {d.petName} · {formatDate(d.date)}
                  </Link>
                  <span className="font-medium text-red-700 tabular-nums">
                    {formatCurrency(d.remaining)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Mascotas</h2>
          <ButtonLink href={`/mascotas/nuevo?tutor=${tutor.id}`}>
            + Nueva mascota
          </ButtonLink>
        </div>

        {petList.length === 0 ? (
          <EmptyState
            title="Sin mascotas"
            description="Agrega la primera mascota de este cliente."
          />
        ) : (
          <div className="space-y-3">
            {petList.map((p) => (
              <Link key={p.id} href={`/mascotas/${p.id}`} className="block">
                <Card className="flex items-center justify-between gap-3 p-4 transition hover:border-primary-300">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{p.name}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {SPECIES_LABELS[p.species as Species] ?? p.species}
                      {p.breed ? ` · ${p.breed}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-primary-600">Ver ficha →</span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
