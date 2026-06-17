import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, eq, like, or, sql } from "drizzle-orm";
import { db, pets, tutors } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/form-fields";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim();

  const conditions = [eq(tutors.active, true)];
  if (q) {
    const pattern = `%${q.toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${tutors.name})`, pattern),
        like(sql`lower(${tutors.phone})`, pattern),
        like(sql`lower(${tutors.email})`, pattern),
        like(sql`lower(${tutors.rut})`, pattern)
      )!
    );
  }

  const list = db
    .select({
      id: tutors.id,
      name: tutors.name,
      phone: tutors.phone,
      email: tutors.email,
      petCount: sql<number>`(select count(*) from ${pets} where ${pets.tutorId} = ${tutors.id} and ${pets.active} = 1)`,
    })
    .from(tutors)
    .where(and(...conditions))
    .orderBy(asc(tutors.name))
    .all();

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle={`${list.length} cliente${list.length === 1 ? "" : "s"}`}
        action={<ButtonLink href="/clientes/nuevo">+ Nuevo cliente</ButtonLink>}
      />

      <form method="GET" className="mb-4">
        <Input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, teléfono, email o RUT…"
          aria-label="Buscar cliente"
        />
      </form>

      {list.length === 0 ? (
        <EmptyState
          title="Sin clientes"
          description="Crea la ficha de un tutor para registrar sus mascotas y su historial."
          action={<ButtonLink href="/clientes/nuevo">Nuevo cliente</ButtonLink>}
        />
      ) : (
        <div className="space-y-3">
          {list.map((t) => (
            <Link key={t.id} href={`/clientes/${t.id}`} className="block">
              <Card className="flex items-center justify-between gap-3 p-4 transition hover:border-primary-300">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">{t.name}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {[t.phone, t.email].filter(Boolean).join(" · ") || "Sin contacto"}
                  </p>
                </div>
                <span className="shrink-0 text-sm text-gray-500">
                  {t.petCount} mascota{t.petCount === 1 ? "" : "s"}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
