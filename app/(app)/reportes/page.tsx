import type { Metadata } from "next";
import { formatCurrency } from "@/lib/currency";
import {
  getMonthlyReport,
  getPaymentMethodBreakdown,
  getExpenseCategoryBreakdown,
} from "@/lib/queries/reports";
import {
  PAYMENT_METHOD_LABELS,
  EXPENSE_CATEGORY_LABELS,
  type PaymentMethod,
  type ExpenseCategory,
} from "@/lib/constants";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button-link";
import { MonthlyChart, BreakdownPie } from "@/components/reportes/reports-charts";

export const metadata: Metadata = { title: "Reportes" };

const MONTH_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function shortMonth(yyyyMm: string): string {
  const [year, month] = yyyyMm.split("-").map(Number);
  return `${MONTH_SHORT[(month ?? 1) - 1]} ${String(year).slice(2)}`;
}

export default function ReportesPage() {
  const settings = getSettings();
  const report = getMonthlyReport(12);
  const totals = report.reduce(
    (acc, r) => ({
      income: acc.income + r.income,
      expenses: acc.expenses + r.expenses,
    }),
    { income: 0, expenses: 0 }
  );

  // Los precios se guardan con IVA incluido: el neto se deriva dividiendo.
  const netIncome = settings.ivaEnabled
    ? Math.round(totals.income / (1 + settings.ivaRate / 100))
    : totals.income;
  const ivaIncluded = totals.income - netIncome;
  const netProfit = netIncome - totals.expenses;

  // Recharts: cronológico ascendente (el query viene descendente)
  const monthly = [...report]
    .reverse()
    .map((r) => ({
      label: shortMonth(r.month),
      income: r.income,
      expenses: r.expenses,
      profit: r.profit,
    }));

  const paymentMethods = getPaymentMethodBreakdown().map((b) => ({
    label: PAYMENT_METHOD_LABELS[b.key as PaymentMethod] ?? b.key,
    total: b.total,
  }));
  const expenseCategories = getExpenseCategoryBreakdown().map((b) => ({
    label: EXPENSE_CATEGORY_LABELS[b.key as ExpenseCategory] ?? b.key,
    total: b.total,
  }));

  return (
    <>
      <PageHeader
        title="Reportes"
        subtitle="Ingresos, gastos y ganancia de los últimos 12 meses"
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

          {settings.ivaEnabled && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card className="p-4">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Ingresos netos (sin IVA)
                </p>
                <p className="mt-1 text-xl font-bold text-emerald-600 tabular-nums">
                  {formatCurrency(netIncome)}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  IVA incluido ({settings.ivaRate}%)
                </p>
                <p className="mt-1 text-xl font-bold text-gray-700 tabular-nums">
                  {formatCurrency(ivaIncluded)}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Ganancia neta (sin IVA)
                </p>
                <p
                  className={`mt-1 text-xl font-bold tabular-nums ${
                    netProfit >= 0 ? "text-primary-700" : "text-red-600"
                  }`}
                >
                  {formatCurrency(netProfit)}
                </p>
              </Card>
            </div>
          )}

          <Card className="p-5">
            <h2 className="mb-3 font-semibold text-gray-900">Ingresos vs gastos</h2>
            <MonthlyChart data={monthly} />
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-3 font-semibold text-gray-900">Métodos de pago</h2>
              <BreakdownPie data={paymentMethods} />
            </Card>
            <Card className="p-5">
              <h2 className="mb-3 font-semibold text-gray-900">Gastos por categoría</h2>
              <BreakdownPie data={expenseCategories} />
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
