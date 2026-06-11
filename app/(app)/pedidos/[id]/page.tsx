import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, orderItems, orders, products } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import {
  deleteOrder,
  markOrderPurchased,
  markOrderReceived,
} from "@/lib/actions/orders";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DeleteButton } from "@/components/ui/delete-button";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { OrderStatusBadge } from "@/components/pedidos/order-status-badge";

export const metadata: Metadata = { title: "Detalle de pedido" };

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = db
    .select()
    .from(orders)
    .where(eq(orders.id, Number(id)))
    .get();

  if (!order) notFound();

  const items = db
    .select({
      id: orderItems.id,
      name: products.name,
      quantity: orderItems.quantity,
      unitCost: orderItems.unitCost,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, order.id))
    .all();

  return (
    <>
      <PageHeader
        title={`Pedido #${order.id}`}
        subtitle={`${order.supplier} · creado el ${formatDate(order.createdAt)}`}
        action={<OrderStatusBadge status={order.status} />}
      />

      <div className="max-w-2xl space-y-4">
        {order.notes && (
          <Card className="p-5">
            <h2 className="mb-1 text-sm font-semibold text-gray-700">Notas</h2>
            <p className="text-sm whitespace-pre-wrap text-gray-600">{order.notes}</p>
          </Card>
        )}

        <Card className="p-5">
          <h2 className="mb-2 font-semibold text-gray-900">Productos</h2>
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="min-w-0 truncate text-gray-700">
                  {item.name}
                  <span className="text-gray-400"> × {item.quantity}</span>
                </span>
                <span className="shrink-0 font-medium text-gray-900 tabular-nums">
                  {formatCurrency(item.unitCost * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
            <span className="font-semibold text-gray-700">Costo total</span>
            <span className="text-xl font-bold text-gray-900 tabular-nums">
              {formatCurrency(order.totalCost)}
            </span>
          </div>
        </Card>

        {order.status === "pedido" && (
          <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-gray-600">
              ¿Ya compraste este pedido al proveedor?
            </p>
            <div className="flex items-center gap-2">
              <DeleteButton
                action={deleteOrder.bind(null, order.id)}
                confirmMessage="¿Eliminar este pedido?"
              />
              <ConfirmActionButton
                action={markOrderPurchased.bind(null, order.id)}
                confirmTitle="¿Marcar como comprado?"
                confirmMessage={`El pedido #${order.id} pasará al estado "comprado".`}
                confirmText="Sí, marcar comprado"
              >
                Marcar como comprado
              </ConfirmActionButton>
            </div>
          </Card>
        )}

        {order.status === "comprado" && (
          <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-gray-600">
              Al recibirlo, el stock se suma al inventario y se registra el gasto.
            </p>
            <div className="flex items-center gap-2">
              <DeleteButton
                action={deleteOrder.bind(null, order.id)}
                confirmMessage="¿Eliminar este pedido?"
              />
              <ConfirmActionButton
                action={markOrderReceived.bind(null, order.id)}
                confirmTitle="¿Marcar como recibido?"
                confirmMessage="El stock se sumará al inventario y el gasto quedará registrado. Esta acción no se puede deshacer."
                confirmText="Sí, recibir pedido"
              >
                Marcar como recibido
              </ConfirmActionButton>
            </div>
          </Card>
        )}

        {order.status === "recibido" && order.receivedAt && (
          <Card className="bg-emerald-50 p-5">
            <p className="text-sm text-emerald-800">
              ✓ Recibido el {formatDate(order.receivedAt)}. El stock fue sumado al
              inventario y el gasto quedó registrado.
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
