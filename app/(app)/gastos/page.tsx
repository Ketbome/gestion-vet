import type { Metadata } from "next";
import Link from "next/link";
import { and, between, desc, sql } from "drizzle-orm";
import { db, expenses } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { formatDate, rangeFromSearchParams } from "@/lib/dates";
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from "@/lib/constants";
import { deleteExpense } from "@/lib/actions/expenses";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { DateRangeFilter } from "@/components/date-range-filter";

export const metadata: Metadata = { title: "Gastos" };

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string; desde?: string; hasta?: string }>;
}) {
  const range = rangeFromSearchParams(await searchParams);

  const list = db
    .select()
    .from(expenses)
    .where(and(between(expenses.date, range.start, range.end)))
    .orderBy(desc(expenses.date), desc(expenses.id))
    .all();

  const [{ total }] = db
    .select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` })
    .from(expenses)
    .where(between(expenses.date, range.start, range.end))
    .all();

  return (
    <>
      <PageHeader
        title="Gastos"
        subtitle={`Total del período: ${formatCurrency(total)}`}
        action={<ButtonLink href="/gastos/nuevo">+ Nuevo gasto</ButtonLink>}
      />

      <DateRangeFilter />

      {list.length === 0 ? (
        <EmptyState
          title="Sin gastos en este período"
          description="Registra arriendo, sueldos u otros gastos. Los pedidos recibidos se agregan solos."
          action={<ButtonLink href="/gastos/nuevo">Registrar gasto</ButtonLink>}
        />
      ) : (
        <div className="space-y-3">
          {list.map((e) => {
            const isAuto = e.orderId != null;
            return (
              <Card key={e.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">
                    {e.description}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>{formatDate(e.date)}</span>
                    <Badge variant={isAuto ? "blue" : "gray"}>
                      {EXPENSE_CATEGORY_LABELS[e.category as ExpenseCategory] ??
                        e.category}
                    </Badge>
                    {isAuto && (
                      <Link
                        href={`/pedidos/${e.orderId}`}
                        className="text-primary-600 hover:underline"
                      >
                        Ver pedido
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <p className="mr-2 font-bold text-red-600 tabular-nums">
                    −{formatCurrency(e.amount)}
                  </p>
                  {!isAuto && (
                    <>
                      <Link
                        href={`/gastos/${e.id}/editar`}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                      >
                        Editar
                      </Link>
                      <DeleteButton
                        action={deleteExpense.bind(null, e.id)}
                        confirmMessage="¿Eliminar este gasto?"
                      />
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
