import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  db,
  attentions,
  attentionProducts,
  attentionServices,
  products,
  services,
} from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { deleteAttention } from "@/lib/actions/attentions";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DeleteButton } from "@/components/ui/delete-button";

export const metadata: Metadata = { title: "Detalle de atención" };

export default async function AtencionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const attention = db
    .select()
    .from(attentions)
    .where(eq(attentions.id, Number(id)))
    .get();

  if (!attention) notFound();

  const serviceLines = db
    .select({
      id: attentionServices.id,
      name: services.name,
      quantity: attentionServices.quantity,
      unitPrice: attentionServices.unitPrice,
    })
    .from(attentionServices)
    .innerJoin(services, eq(attentionServices.serviceId, services.id))
    .where(eq(attentionServices.attentionId, attention.id))
    .all();

  const productLines = db
    .select({
      id: attentionProducts.id,
      name: products.name,
      quantity: attentionProducts.quantity,
      unitPrice: attentionProducts.unitPrice,
    })
    .from(attentionProducts)
    .innerJoin(products, eq(attentionProducts.productId, products.id))
    .where(eq(attentionProducts.attentionId, attention.id))
    .all();

  return (
    <>
      <PageHeader
        title={attention.petName}
        subtitle={`${attention.ownerName} · ${formatDate(attention.date)}`}
        action={
          <DeleteButton
            action={deleteAttention.bind(null, attention.id)}
            confirmMessage="¿Eliminar esta atención? El stock de los productos vendidos se devolverá al inventario."
          >
            Eliminar atención
          </DeleteButton>
        }
      />

      <div className="max-w-2xl space-y-4">
        {attention.notes && (
          <Card className="p-5">
            <h2 className="mb-1 text-sm font-semibold text-gray-700">Notas</h2>
            <p className="text-sm whitespace-pre-wrap text-gray-600">
              {attention.notes}
            </p>
          </Card>
        )}

        {serviceLines.length > 0 && (
          <Card className="p-5">
            <h2 className="mb-2 font-semibold text-gray-900">Servicios</h2>
            <DetailLines lines={serviceLines} />
          </Card>
        )}

        {productLines.length > 0 && (
          <Card className="p-5">
            <h2 className="mb-2 font-semibold text-gray-900">Productos</h2>
            <DetailLines lines={productLines} />
          </Card>
        )}

        <Card className="flex items-center justify-between p-5">
          <span className="font-semibold text-gray-700">Total</span>
          <span className="text-2xl font-bold text-primary-700 tabular-nums">
            {formatCurrency(attention.total)}
          </span>
        </Card>
      </div>
    </>
  );
}

function DetailLines({
  lines,
}: {
  lines: { id: number; name: string; quantity: number; unitPrice: number }[];
}) {
  return (
    <ul className="divide-y divide-gray-100">
      {lines.map((l) => (
        <li key={l.id} className="flex items-center justify-between gap-2 py-2 text-sm">
          <span className="min-w-0 truncate text-gray-700">
            {l.name}
            {l.quantity > 1 && (
              <span className="text-gray-400"> × {l.quantity}</span>
            )}
          </span>
          <span className="shrink-0 font-medium text-gray-900 tabular-nums">
            {formatCurrency(l.unitPrice * l.quantity)}
          </span>
        </li>
      ))}
    </ul>
  );
}
