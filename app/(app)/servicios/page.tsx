import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db, services } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { deleteService } from "@/lib/actions/services";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import Link from "next/link";

export const metadata: Metadata = { title: "Servicios" };

export default async function ServiciosPage() {
  const list = db
    .select()
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.name))
    .all();

  return (
    <>
      <PageHeader
        title="Servicios"
        subtitle="Catálogo de servicios con sus precios"
        action={<ButtonLink href="/servicios/nuevo">+ Nuevo servicio</ButtonLink>}
      />

      {list.length === 0 ? (
        <EmptyState
          title="No hay servicios"
          description="Crea tu primer servicio para usarlo al registrar atenciones."
          action={<ButtonLink href="/servicios/nuevo">Crear servicio</ButtonLink>}
        />
      ) : (
        <div className="space-y-3">
          {list.map((s) => (
            <Card key={s.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">{s.name}</p>
                {s.description && (
                  <p className="truncate text-sm text-gray-500">{s.description}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <p className="mr-2 font-bold text-primary-700 tabular-nums">
                  {formatCurrency(s.price)}
                </p>
                <Link
                  href={`/servicios/${s.id}/editar`}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                >
                  Editar
                </Link>
                <DeleteButton
                  action={deleteService.bind(null, s.id)}
                  confirmMessage={`¿Eliminar el servicio "${s.name}"?`}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
