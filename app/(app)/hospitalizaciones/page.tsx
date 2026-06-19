import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { db, hospitalizations, pets, tutors } from "@/lib/db";
import { getClinicMode } from "@/lib/settings";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/form-fields";

export const metadata: Metadata = { title: "Hospitalización" };

export default async function HospitalizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (getClinicMode() !== "completo") redirect("/");

  const { q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim();

  const conditions = [];
  if (q) {
    const pattern = `%${q.toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${pets.name})`, pattern),
        like(sql`lower(${tutors.name})`, pattern)
      )!
    );
  }

  const list = db
    .select({
      id: hospitalizations.id,
      petId: hospitalizations.petId,
      petName: pets.name,
      tutorName: tutors.name,
      admittedAt: hospitalizations.admittedAt,
      dischargedAt: hospitalizations.dischargedAt,
      status: hospitalizations.status,
      total: hospitalizations.total,
    })
    .from(hospitalizations)
    .innerJoin(pets, eq(hospitalizations.petId, pets.id))
    .leftJoin(tutors, eq(hospitalizations.tutorId, tutors.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(hospitalizations.admittedAt), desc(hospitalizations.id))
    .all();

  const active = list.filter((h) => h.status === "activa");
  const past = list.filter((h) => h.status !== "activa");

  return (
    <>
      <PageHeader
        title="Hospitalización"
        subtitle={`${active.length} paciente${active.length === 1 ? "" : "s"} internado${active.length === 1 ? "" : "s"}`}
        action={
          <ButtonLink href="/hospitalizaciones/nueva">+ Hospitalizar</ButtonLink>
        }
      />

      <form method="GET" className="mb-4">
        <Input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por mascota o tutor…"
          aria-label="Buscar hospitalización"
        />
      </form>

      {list.length === 0 ? (
        <EmptyState
          title="Sin hospitalizaciones"
          description="Hospitaliza una mascota para llevar su evolución diaria, cargos y cobro."
          action={<ButtonLink href="/hospitalizaciones/nueva">Hospitalizar</ButtonLink>}
        />
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500">Activas</h2>
              {active.map((h) => (
                <Row key={h.id} h={h} />
              ))}
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500">Historial</h2>
              {past.map((h) => (
                <Row key={h.id} h={h} />
              ))}
            </section>
          )}
        </div>
      )}
    </>
  );
}

function Row({
  h,
}: {
  h: {
    id: number;
    petName: string;
    tutorName: string | null;
    admittedAt: string;
    dischargedAt: string | null;
    status: string;
    total: number;
  };
}) {
  const active = h.status === "activa";
  return (
    <Link href={`/hospitalizaciones/${h.id}`} className="block">
      <Card className="flex items-center justify-between gap-3 p-4 transition hover:border-primary-300">
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">{h.petName}</p>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {h.tutorName ?? "Sin tutor"} · Ingreso {formatDate(h.admittedAt)}
            {h.dischargedAt && ` · Alta ${formatDate(h.dischargedAt)}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {h.total > 0 && (
            <span className="text-sm font-semibold text-primary-700 tabular-nums">
              {formatCurrency(h.total)}
            </span>
          )}
          <Badge variant={active ? "amber" : "gray"}>
            {active ? "Activa" : "Alta"}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}
