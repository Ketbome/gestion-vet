import type { Metadata } from "next";
import Link from "next/link";
import { and, between, desc, like, or, sql } from "drizzle-orm";
import { db, attentions } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { formatDate, rangeFromSearchParams } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/form-fields";
import { DateRangeFilter } from "@/components/date-range-filter";

export const metadata: Metadata = { title: "Atenciones" };

export default async function AtencionesPage({
  searchParams,
}: {
  searchParams: Promise<{
    rango?: string;
    desde?: string;
    hasta?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const range = rangeFromSearchParams(params);
  const q = (params.q ?? "").trim();

  const conditions = [between(attentions.date, range.start, range.end)];
  if (q) {
    const pattern = `%${q.toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${attentions.petName})`, pattern),
        like(sql`lower(${attentions.ownerName})`, pattern)
      )!
    );
  }

  const list = db
    .select()
    .from(attentions)
    .where(and(...conditions))
    .orderBy(desc(attentions.date), desc(attentions.id))
    .all();

  const totalPeriodo = list.reduce((sum, a) => sum + a.total, 0);

  return (
    <>
      <PageHeader
        title="Atenciones"
        subtitle={`${list.length} atención${list.length === 1 ? "" : "es"} · ${formatCurrency(totalPeriodo)} en el período`}
        action={<ButtonLink href="/atenciones/nueva">+ Nueva atención</ButtonLink>}
      />

      <DateRangeFilter />

      <form method="GET" className="mb-4">
        {params.rango && <input type="hidden" name="rango" value={params.rango} />}
        {params.desde && <input type="hidden" name="desde" value={params.desde} />}
        {params.hasta && <input type="hidden" name="hasta" value={params.hasta} />}
        <Input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por mascota o dueño…"
          aria-label="Buscar atención"
        />
      </form>

      {list.length === 0 ? (
        <EmptyState
          title="Sin atenciones en este período"
          description="Registra tu primera atención con sus servicios y productos vendidos."
          action={<ButtonLink href="/atenciones/nueva">Nueva atención</ButtonLink>}
        />
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <Link key={a.id} href={`/atenciones/${a.id}`} className="block">
              <Card className="flex items-center justify-between gap-3 p-4 transition hover:border-primary-300">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">
                    {a.petName}
                    <span className="font-normal text-gray-500"> · {a.ownerName}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">{formatDate(a.date)}</p>
                </div>
                <p className="shrink-0 font-bold text-primary-700 tabular-nums">
                  {formatCurrency(a.total)}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
