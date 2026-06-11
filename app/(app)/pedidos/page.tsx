import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, orders } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusBadge } from "@/components/pedidos/order-status-badge";

export const metadata: Metadata = { title: "Pedidos" };

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado = "" } = await searchParams;

  const query = db.select().from(orders).orderBy(desc(orders.id));
  const list = (
    (ORDER_STATUSES as readonly string[]).includes(estado)
      ? query.where(eq(orders.status, estado))
      : query
  ).all();

  return (
    <>
      <PageHeader
        title="Pedidos"
        subtitle="Pedidos a proveedores: pedido → comprado → recibido"
        action={<ButtonLink href="/pedidos/nuevo">+ Nuevo pedido</ButtonLink>}
      />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <FilterPill href="/pedidos" active={!estado}>
          Todos
        </FilterPill>
        {ORDER_STATUSES.map((s) => (
          <FilterPill key={s} href={`/pedidos?estado=${s}`} active={estado === s}>
            {ORDER_STATUS_LABELS[s]}
          </FilterPill>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Sin pedidos"
          description="Crea un pedido de vacunas o insumos y sigue su estado hasta recibirlo."
          action={<ButtonLink href="/pedidos/nuevo">Nuevo pedido</ButtonLink>}
        />
      ) : (
        <div className="space-y-3">
          {list.map((o) => (
            <Link key={o.id} href={`/pedidos/${o.id}`} className="block">
              <Card className="flex items-center justify-between gap-3 p-4 transition hover:border-primary-300">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">
                    Pedido #{o.id}
                    <span className="font-normal text-gray-500"> · {o.supplier}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {formatDate(o.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <OrderStatusBadge status={o.status} />
                  <p className="font-bold text-gray-900 tabular-nums">
                    {formatCurrency(o.totalCost)}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-primary-600 text-white"
          : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
      }`}
    >
      {children}
    </Link>
  );
}
