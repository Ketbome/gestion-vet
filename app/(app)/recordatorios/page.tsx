import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getClinicMode } from "@/lib/settings";
import { formatDate, today } from "@/lib/dates";
import {
  HEALTH_RECORD_TYPE_LABELS,
  type HealthRecordType,
} from "@/lib/constants";
import {
  getUpcomingVisits,
  getInactivePets,
  getDueHealthRecords,
} from "@/lib/queries/reminders";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Recordatorios" };

export default function RecordatoriosPage() {
  if (getClinicMode() !== "completo") redirect("/");

  const todayIso = today();
  const visits = getUpcomingVisits();
  const due = getDueHealthRecords(30);
  const inactive = getInactivePets(12);

  const empty = visits.length === 0 && due.length === 0 && inactive.length === 0;

  return (
    <>
      <PageHeader
        title="Recordatorios"
        subtitle="Seguimiento de controles, vacunas y pacientes sin visitas"
      />

      {empty ? (
        <EmptyState
          title="Todo al día"
          description="No hay controles pendientes, vacunas por vencer ni mascotas sin visitas recientes."
        />
      ) : (
        <div className="space-y-4">
          <Card className="space-y-3 p-5">
            <h2 className="font-semibold text-gray-900">
              Próximos controles{" "}
              <span className="text-sm font-normal text-gray-400">({visits.length})</span>
            </h2>
            {visits.length === 0 ? (
              <p className="text-sm text-gray-400">Sin controles agendados.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {visits.map((v) => {
                  const overdue = v.date < todayIso;
                  return (
                    <li
                      key={v.petId}
                      className="flex items-center justify-between gap-2 py-2 text-sm"
                    >
                      <Link
                        href={`/mascotas/${v.petId}`}
                        className="min-w-0 truncate text-gray-700 hover:underline"
                      >
                        <strong className="font-medium text-gray-900">{v.petName}</strong>
                        {" · "}
                        {v.tutorName}
                        {v.tutorPhone ? ` · ${v.tutorPhone}` : ""}
                        {v.note ? (
                          <span className="text-gray-400"> · {v.note}</span>
                        ) : null}
                      </Link>
                      <span
                        className={`shrink-0 font-medium tabular-nums ${
                          overdue ? "text-red-600" : "text-primary-700"
                        }`}
                      >
                        {formatDate(v.date)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="space-y-3 p-5">
            <h2 className="font-semibold text-gray-900">
              Vacunas y antiparasitarios por vencer{" "}
              <span className="text-sm font-normal text-gray-400">({due.length})</span>
            </h2>
            {due.length === 0 ? (
              <p className="text-sm text-gray-400">Nada por vencer en los próximos 30 días.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {due.map((r) => {
                  const overdue = r.nextDueDate < todayIso;
                  return (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-2 py-2 text-sm"
                    >
                      <Link
                        href={`/mascotas/${r.petId}`}
                        className="min-w-0 truncate text-gray-700 hover:underline"
                      >
                        <strong className="font-medium text-gray-900">{r.petName}</strong>
                        {" · "}
                        {r.name}
                        <span className="text-gray-400">
                          {" "}
                          ({HEALTH_RECORD_TYPE_LABELS[r.type as HealthRecordType] ?? r.type})
                        </span>
                      </Link>
                      <span
                        className={`shrink-0 font-medium tabular-nums ${
                          overdue ? "text-red-600" : "text-amber-700"
                        }`}
                      >
                        {formatDate(r.nextDueDate)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="space-y-3 p-5">
            <h2 className="font-semibold text-gray-900">
              Sin visitas hace más de un año{" "}
              <span className="text-sm font-normal text-gray-400">({inactive.length})</span>
            </h2>
            {inactive.length === 0 ? (
              <p className="text-sm text-gray-400">
                Todas las mascotas activas tienen visitas recientes.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {inactive.map((p) => (
                  <li
                    key={p.petId}
                    className="flex items-center justify-between gap-2 py-2 text-sm"
                  >
                    <Link
                      href={`/mascotas/${p.petId}`}
                      className="min-w-0 truncate text-gray-700 hover:underline"
                    >
                      <strong className="font-medium text-gray-900">{p.petName}</strong>
                      {" · "}
                      {p.tutorName}
                      {p.tutorPhone ? ` · ${p.tutorPhone}` : ""}
                    </Link>
                    <span className="shrink-0 text-gray-500 tabular-nums">
                      última {formatDate(p.lastVisit)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
