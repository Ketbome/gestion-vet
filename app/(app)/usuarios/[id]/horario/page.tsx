import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, users, vetSchedules } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { deleteSchedule } from "@/lib/actions/schedules";
import { WEEKDAYS } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { ScheduleForm } from "@/components/usuarios/schedule-form";

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
      </div>
    </>
  );
}
