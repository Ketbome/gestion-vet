import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, between, eq, ne } from "drizzle-orm";
import { db, appointments, vetBlocks } from "@/lib/db";
import { today, formatDate } from "@/lib/dates";
import { getCurrentUser } from "@/lib/auth";
import { confirmAppointment, cancelAppointment } from "@/lib/actions/appointments";
import { deleteBlock } from "@/lib/actions/schedules";
import { getSchedulableVets } from "@/lib/queries/vets";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { DeleteButton } from "@/components/ui/delete-button";
import { Calendar } from "@/components/agenda/calendar";
import { AppointmentStatusBadge } from "@/components/agenda/appointment-status-badge";
import { BlockForm } from "@/components/usuarios/block-form";

export const metadata: Metadata = { title: "Agenda" };

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; dia?: string; vet?: string }>;
}) {
  const { mes, dia, vet } = await searchParams;
  const todayIso = today();
  const selectedDay = /^\d{4}-\d{2}-\d{2}$/.test(dia ?? "") ? dia! : todayIso;
  const monthStr = /^\d{4}-\d{2}$/.test(mes ?? "")
    ? mes!
    : selectedDay.slice(0, 7);
  const [year, month] = monthStr.split("-").map(Number);

  const lastDay = new Date(year, month, 0).getDate();
  const monthStart = `${monthStr}-01`;
  const monthEnd = `${monthStr}-${String(lastDay).padStart(2, "0")}`;

  const vetList = getSchedulableVets();
  const vetName = new Map(vetList.map((v) => [v.id, v.name]));

  const me = await getCurrentUser();
  // Veterinario: por defecto su propia agenda salvo que pida "todos" (vet=all)
  const selectedVet =
    vet === "all"
      ? null
      : vet
        ? Number(vet)
        : me && vetList.some((v) => v.id === me.uid)
          ? me.uid
          : null;

  const vetCond = selectedVet ? [eq(appointments.vetId, selectedVet)] : [];
  const keep = (vetId: number | null) =>
    `mes=${monthStr}&dia=${selectedDay}${vetId === null ? "&vet=all" : vetId ? `&vet=${vetId}` : ""}`;

  const monthAppointments = db
    .select()
    .from(appointments)
    .where(
      and(
        between(appointments.date, monthStart, monthEnd),
        ne(appointments.status, "cancelada"),
        ...vetCond
      )
    )
    .all();

  const counts: Record<string, number> = {};
  for (const a of monthAppointments) {
    counts[a.date] = (counts[a.date] ?? 0) + 1;
  }

  const dayAppointments = db
    .select()
    .from(appointments)
    .where(and(eq(appointments.date, selectedDay), ...vetCond))
    .orderBy(asc(appointments.time))
    .all();

  const dayBlocks = selectedVet
    ? db
        .select()
        .from(vetBlocks)
        .where(and(eq(vetBlocks.userId, selectedVet), eq(vetBlocks.date, selectedDay)))
        .orderBy(asc(vetBlocks.startTime))
        .all()
    : [];

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle="Citas y solicitudes de los clientes"
        action={<ButtonLink href="/agenda/nueva">+ Nueva cita</ButtonLink>}
      />

      {vetList.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <FilterChip href={`/agenda?${keep(null)}`} active={selectedVet === null}>
            Todos
          </FilterChip>
          {vetList.map((v) => (
            <FilterChip
              key={v.id}
              href={`/agenda?${keep(v.id)}`}
              active={selectedVet === v.id}
              color={v.color}
            >
              {v.name}
            </FilterChip>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <Calendar
            year={year}
            month={month - 1}
            selectedDay={selectedDay}
            today={todayIso}
            counts={counts}
          />
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-semibold text-gray-900">
            {formatDate(selectedDay)}
          </h2>
          {dayAppointments.length === 0 ? (
            <p className="text-sm text-gray-400">Sin citas este día.</p>
          ) : (
            <ul className="space-y-3">
              {dayAppointments.map((a) => (
                <li key={a.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">
                        {a.time ? `${a.time} · ` : ""}
                        {a.petName || "—"}
                      </p>
                      <p className="text-sm text-gray-500">{a.tutorName}</p>
                      {(a.tutorPhone || a.tutorEmail) && (
                        <p className="text-xs text-gray-400">
                          {[a.tutorPhone, a.tutorEmail].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      {a.reason && (
                        <p className="mt-1 text-sm text-gray-600">{a.reason}</p>
                      )}
                      <p className="mt-0.5 text-xs">
                        {a.vetId && (
                          <span className="text-gray-500">
                            {vetName.get(a.vetId) ?? ""}
                          </span>
                        )}
                        {a.source === "publica" && (
                          <span className="text-sky-600"> · Solicitud web</span>
                        )}
                      </p>
                    </div>
                    <AppointmentStatusBadge status={a.status} />
                  </div>

                  {a.status !== "completada" && a.status !== "cancelada" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {a.status !== "confirmada" && (
                        <form action={confirmAppointment.bind(null, a.id)}>
                          <button className="rounded-lg bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700">
                            Confirmar
                          </button>
                        </form>
                      )}
                      {a.petId ? (
                        <Link
                          href={`/atenciones/nueva?appointment=${a.id}&pet=${a.petId}`}
                          className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Convertir en atención
                        </Link>
                      ) : (
                        <Link
                          href="/clientes/nuevo"
                          className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Crear ficha
                        </Link>
                      )}
                      <form action={cancelAppointment.bind(null, a.id)}>
                        <button className="rounded-lg px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                          Cancelar
                        </button>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 border-t border-gray-100 pt-3">
            {selectedVet ? (
              <details>
                <summary className="cursor-pointer text-sm font-medium text-gray-600">
                  Bloquear horario · {vetName.get(selectedVet) ?? ""}
                </summary>
                <div className="mt-3 space-y-3">
                  {dayBlocks.length > 0 && (
                    <ul className="divide-y divide-gray-100">
                      {dayBlocks.map((b) => (
                        <li
                          key={b.id}
                          className="flex items-center justify-between gap-2 py-1.5 text-sm"
                        >
                          <span className="text-gray-700">
                            {b.startTime && b.endTime
                              ? `${b.startTime} – ${b.endTime}`
                              : "Día completo"}
                            {b.reason && (
                              <span className="text-gray-400"> · {b.reason}</span>
                            )}
                          </span>
                          <DeleteButton
                            action={deleteBlock.bind(null, b.id, selectedVet)}
                            confirmTitle="¿Quitar bloqueo?"
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                  <BlockForm userId={selectedVet} defaultDate={selectedDay} />
                </div>
              </details>
            ) : (
              <p className="text-sm text-gray-400">
                Elige un veterinario arriba para bloquear horas o días.
              </p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

function FilterChip({
  href,
  active,
  color,
  children,
}: {
  href: string;
  active: boolean;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition ${
        active
          ? "bg-primary-600 text-white"
          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
      }`}
    >
      {color && (
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </Link>
  );
}
