import Link from "next/link";
import { rangeFromSearchParams, formatDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/currency";
import { getDashboardData } from "@/lib/queries/dashboard";
import { getClinicMode } from "@/lib/settings";
import { HEALTH_RECORD_TYPE_LABELS, type HealthRecordType } from "@/lib/constants";
import { confirmAppointment, cancelAppointment } from "@/lib/actions/appointments";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Icon } from "@/components/icons";
import { DateRangeFilter } from "@/components/date-range-filter";
import { OrderStatusBadge } from "@/components/pedidos/order-status-badge";

const RANGE_LABELS: Record<string, string> = {
  hoy: "hoy",
  semana: "esta semana",
  mes: "este mes",
  ano: "este año",
  custom: "en el período",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string; desde?: string; hasta?: string }>;
}) {
  const range = rangeFromSearchParams(await searchParams);
  const data = getDashboardData(range);
  const periodo = RANGE_LABELS[range.rango] ?? "en el período";
  const mode = getClinicMode();

  return (
    <>
      <PageHeader
        title="Inicio"
        subtitle="Resumen de tu veterinaria"
        action={<ButtonLink href="/atenciones/nueva">+ Nueva atención</ButtonLink>}
      />

      <DateRangeFilter />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Ingresos"
          value={formatCurrency(data.income)}
          hint={`${data.attentionCount} atención${data.attentionCount === 1 ? "" : "es"} ${periodo}`}
          tone="positive"
        />
        <StatCard
          label="Gastos"
          value={formatCurrency(data.expensesTotal)}
          hint={periodo}
          tone="negative"
        />
        <StatCard
          label="Ganancia"
          value={formatCurrency(data.profit)}
          hint="ingresos − gastos"
          tone={data.profit >= 0 ? "accent" : "negative"}
        />
        <StatCard
          label="Stock bajo"
          value={String(data.lowStock.length)}
          hint={data.lowStock.length > 0 ? "requiere reposición" : "todo en orden"}
          tone={data.lowStock.length > 0 ? "negative" : "default"}
        />
        {mode === "completo" && (
          <StatCard
            label="Por cobrar"
            value={formatCurrency(data.receivable)}
            hint={data.receivable > 0 ? "saldos pendientes" : "todo cobrado"}
            tone={data.receivable > 0 ? "negative" : "default"}
          />
        )}
      </div>

      {data.lowStock.length > 0 && (
        <Card className="mt-4 border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-amber-800">
            <Icon name="alert" className="h-5 w-5" />
            <h2 className="font-semibold">Alertas de stock</h2>
          </div>
          <ul className="space-y-1">
            {data.lowStock.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <Link
                  href={`/inventario/${p.id}/editar`}
                  className="text-amber-900 hover:underline"
                >
                  {p.name}
                </Link>
                <span className="font-medium text-amber-800 tabular-nums">
                  {p.stock} / mín {p.minStock}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/pedidos/nuevo"
            className="mt-3 inline-block text-sm font-semibold text-amber-800 hover:underline"
          >
            Hacer un pedido →
          </Link>
        </Card>
      )}

      {mode === "completo" && data.pendingConfirmations.length > 0 && (
        <Card className="mt-4 border-blue-200 bg-blue-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-blue-800">
            <Icon name="calendar" className="h-5 w-5" />
            <h2 className="font-semibold">Confirmaciones de mañana</h2>
          </div>
          <p className="mb-2 text-xs text-blue-700">
            Contacta a estos clientes para confirmar su cita.
          </p>
          <ul className="space-y-2">
            {data.pendingConfirmations.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="min-w-0 text-blue-900">
                  {a.time ? `${a.time} · ` : ""}
                  <strong className="font-medium">{a.petName || "—"}</strong>
                  {" · "}
                  {a.tutorName}
                  <span className="text-blue-700">
                    {" "}
                    {[a.tutorPhone, a.tutorEmail].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <form action={confirmAppointment.bind(null, a.id)}>
                    <button className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700">
                      Confirmar
                    </button>
                  </form>
                  <form action={cancelAppointment.bind(null, a.id)}>
                    <button className="rounded-lg px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
                      Cancelar
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {mode === "completo" && data.upcomingDue.length > 0 && (
        <Card className="mt-4 border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-amber-800">
            <Icon name="syringe" className="h-5 w-5" />
            <h2 className="font-semibold">Vacunas y antiparasitarios por vencer</h2>
          </div>
          <ul className="space-y-1">
            {data.upcomingDue.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                <Link href={`/mascotas/${r.petId}`} className="min-w-0 truncate text-amber-900 hover:underline">
                  <strong className="font-medium">{r.petName}</strong>
                  {" · "}
                  {r.name}
                  <span className="text-amber-700">
                    {" "}
                    ({HEALTH_RECORD_TYPE_LABELS[r.type as HealthRecordType] ?? r.type})
                  </span>
                </Link>
                <span className="shrink-0 font-medium text-amber-800 tabular-nums">
                  {r.nextDueDate ? formatDate(r.nextDueDate) : ""}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Servicios más vendidos</h2>
            <Link href="/servicios" className="text-sm text-primary-600 hover:underline">
              Ver todos
            </Link>
          </div>
          <RankList
            items={data.topServices}
            emptyText={`Sin servicios vendidos ${periodo}.`}
          />
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Productos más vendidos</h2>
            <Link href="/inventario" className="text-sm text-primary-600 hover:underline">
              Ver inventario
            </Link>
          </div>
          <RankList
            items={data.topProducts}
            emptyText={`Sin productos vendidos ${periodo}.`}
          />
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Atenciones recientes</h2>
            <Link href="/atenciones" className="text-sm text-primary-600 hover:underline">
              Ver todas
            </Link>
          </div>
          {data.recentAttentions.length === 0 ? (
            <p className="text-sm text-gray-400">Aún no hay atenciones registradas.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.recentAttentions.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/atenciones/${a.id}`}
                    className="flex items-center justify-between gap-2 py-2 text-sm hover:bg-gray-50"
                  >
                    <span className="min-w-0 truncate text-gray-700">
                      <strong className="font-medium text-gray-900">{a.petName}</strong>
                      {" · "}
                      {a.ownerName}
                      <span className="text-gray-400"> · {formatDate(a.date)}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-primary-700 tabular-nums">
                      {formatCurrency(a.total)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Pedidos pendientes</h2>
            <Link href="/pedidos" className="text-sm text-primary-600 hover:underline">
              Ver todos
            </Link>
          </div>
          {data.pendingOrders.length === 0 ? (
            <p className="text-sm text-gray-400">No hay pedidos pendientes.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.pendingOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/pedidos/${o.id}`}
                    className="flex items-center justify-between gap-2 py-2 text-sm hover:bg-gray-50"
                  >
                    <span className="min-w-0 truncate text-gray-700">
                      <strong className="font-medium text-gray-900">#{o.id}</strong>
                      {" · "}
                      {o.supplier}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <OrderStatusBadge status={o.status} />
                      <span className="font-semibold text-gray-900 tabular-nums">
                        {formatCurrency(o.totalCost)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function RankList({
  items,
  emptyText,
}: {
  items: { name: string; quantity: number; total: number }[];
  emptyText: string;
}) {
  if (items.length === 0)
    return <p className="text-sm text-gray-400">{emptyText}</p>;

  const max = Math.max(...items.map((i) => i.total), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.name}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-gray-700">
              {item.name}
              <span className="text-gray-400"> × {item.quantity}</span>
            </span>
            <span className="shrink-0 font-semibold text-gray-900 tabular-nums">
              {formatCurrency(item.total)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-primary-500"
              style={{ width: `${Math.max((item.total / max) * 100, 4)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
