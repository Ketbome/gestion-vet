import type { Metadata } from "next";
import { formatCurrency } from "@/lib/currency";
import { getMonthlyReport } from "@/lib/queries/reports";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button-link";

export const metadata: Metadata = { title: "Reportes" };

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function monthLabel(yyyyMm: string): string {
  const [year, month] = yyyyMm.split("-").map(Number);
  return `${MONTH_NAMES[(month ?? 1) - 1]} ${year}`;
}

export default function ReportesPage() {
  const report = getMonthlyReport(12);
  const maxValue = Math.max(
    ...report.map((r) => Math.max(r.income, r.expenses)),
    1
  );

  const totals = report.reduce(
    (acc, r) => ({
      income: acc.income + r.income,
      expenses: acc.expenses + r.expenses,
    }),
    { income: 0, expenses: 0 }
  );

  return (
    <>
      <PageHeader
        title="Reportes"
        subtitle="Ingresos vs gastos de los últimos 12 meses"
      />

      {report.length === 0 ? (
        <EmptyState
          title="Aún no hay datos"
          description="Cuando registres atenciones y gastos verás aquí la evolución mensual."
          action={<ButtonLink href="/atenciones/nueva">Registrar atención</ButtonLink>}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase">Ingresos totales</p>
              <p className="mt-1 text-xl font-bold text-emerald-600 tabular-nums">
                {formatCurrency(totals.income)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase">Gastos totales</p>
              <p className="mt-1 text-xl font-bold text-red-600 tabular-nums">
                {formatCurrency(totals.expenses)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase">Ganancia</p>
              <p
                className={`mt-1 text-xl font-bold tabular-nums ${
                  totals.income - totals.expenses >= 0
                    ? "text-primary-700"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(totals.income - totals.expenses)}
              </p>
            </Card>
          </div>

          <div className="space-y-3">
            {report.map((r) => (
              <Card key={r.month} className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">{monthLabel(r.month)}</h2>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      r.profit >= 0 ? "text-primary-700" : "text-red-600"
                    }`}
                  >
                    {r.profit >= 0 ? "+" : ""}
                    {formatCurrency(r.profit)}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <BarRow
                    label="Ingresos"
                    value={r.income}
                    max={maxValue}
                    colorClass="bg-emerald-500"
                  />
                  <BarRow
                    label="Gastos"
                    value={r.expenses}
                    max={maxValue}
                    colorClass="bg-red-400"
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function BarRow({
  label,
  value,
  max,
  colorClass,
}: {
  label: string;
  value: number;
  max: number;
  colorClass: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-16 shrink-0 text-xs text-gray-500">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${value > 0 ? Math.max((value / max) * 100, 2) : 0}%` }}
        />
      </div>
      <span className="w-24 shrink-0 text-right text-xs font-medium text-gray-700 tabular-nums">
        {formatCurrency(value)}
      </span>
    </div>
  );
}
