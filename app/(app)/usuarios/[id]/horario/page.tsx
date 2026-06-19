import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq, gte } from "drizzle-orm";
import { db, users, vetSchedules, vetBlocks } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { deleteSchedule, deleteBlock } from "@/lib/actions/schedules";
import { WEEKDAYS } from "@/lib/constants";
import { formatDate, today } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { ScheduleForm } from "@/components/usuarios/schedule-form";
import { BlockForm } from "@/components/usuarios/block-form";

export const metadata: Metadata = { title: "Horario" };

export default async function HorarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = Number(id);

  const me = await getCurrentUser();
  if (!me || (me.role !== "admin" && me.uid !== userId)) redirect("/");

  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) notFound();

  const schedules = db
    .select()
    .from(vetSchedules)
    .where(eq(vetSchedules.userId, userId))
    .orderBy(asc(vetSchedules.weekday), asc(vetSchedules.startTime))
    .all();

  const blocks = db
    .select()
    .from(vetBlocks)
    .where(and(eq(vetBlocks.userId, userId), gte(vetBlocks.date, today())))
    .orderBy(asc(vetBlocks.date), asc(vetBlocks.startTime))
    .all();

  return (
    <>
      <PageHeader
        title="Horario de atención"
        subtitle={user.name}
      />
      <div className="max-w-lg space-y-4">
        <Card className="p-5">
          <ScheduleForm userId={userId} />
        </Card>

        {schedules.length === 0 ? (
          <EmptyState
            title="Sin horario definido"
            description="Agrega bloques horarios para habilitar la reserva por cupos."
          />
        ) : (
          <Card className="divide-y divide-gray-100 p-2">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <span className="text-gray-700">
                  <span className="font-medium">{WEEKDAYS[s.weekday]}</span>{" "}
                  {s.startTime} – {s.endTime}
                </span>
                <DeleteButton
                  action={deleteSchedule.bind(null, s.id, userId)}
                  confirmTitle="¿Eliminar bloque?"
                />
              </div>
            ))}
          </Card>
        )}

        <div>
          <h2 className="mb-2 mt-2 font-semibold text-gray-900">Bloqueos puntuales</h2>
          <p className="mb-3 text-sm text-gray-500">
            Bloquea un día completo o un rango de horas en una fecha específica (ej.
            vacaciones, una mañana libre). No se podrán reservar esos cupos.
          </p>
          <Card className="p-5">
            <BlockForm userId={userId} />
          </Card>
          {blocks.length > 0 && (
            <Card className="mt-3 divide-y divide-gray-100 p-2">
              {blocks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <span className="text-gray-700">
                    <span className="font-medium">{formatDate(b.date)}</span>{" "}
                    {b.startTime && b.endTime
                      ? `${b.startTime} – ${b.endTime}`
                      : "Día completo"}
                    {b.reason && <span className="text-gray-400"> · {b.reason}</span>}
                  </span>
                  <DeleteButton
                    action={deleteBlock.bind(null, b.id, userId)}
                    confirmTitle="¿Quitar bloqueo?"
                  />
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
