import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import {
  db,
  attentions,
  attentionProducts,
  attentionServices,
  payments,
  prescriptions,
  prescriptionItems,
  products,
  services,
  users,
} from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { formatDate, today } from "@/lib/dates";
import { getCurrentUser } from "@/lib/auth";
import { getClinicMode } from "@/lib/settings";
import {
  PAYMENT_METHOD_LABELS,
  paymentStatus,
  type PaymentMethod,
} from "@/lib/constants";
import { deleteAttention } from "@/lib/actions/attentions";
import { deletePrescription } from "@/lib/actions/prescriptions";
import { deletePayment, markAttentionPaid } from "@/lib/actions/payments";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { DeleteButton } from "@/components/ui/delete-button";
import { PaymentForm } from "@/components/pagos/payment-form";

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

  const me = await getCurrentUser();
  const complete = getClinicMode() === "completo";
  const canClinical = complete && me?.role !== "recepcion";

  const vet = attention.vetId
    ? db.select({ name: users.name }).from(users).where(eq(users.id, attention.vetId)).get()
    : null;

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

  const paymentList = db
    .select()
    .from(payments)
    .where(eq(payments.attentionId, attention.id))
    .orderBy(desc(payments.date))
    .all();
  const paid = paymentList.reduce((sum, p) => sum + p.amount, 0);
  const remaining = attention.total - paid;
  const status = paymentStatus(attention.total, paid);

  const prescriptionList = db
    .select({
      id: prescriptions.id,
      date: prescriptions.date,
      count: sql<number>`(select count(*) from ${prescriptionItems} where ${prescriptionItems.prescriptionId} = ${prescriptions.id})`,
    })
    .from(prescriptions)
    .where(eq(prescriptions.attentionId, attention.id))
    .orderBy(desc(prescriptions.date))
    .all();

  const hasClinical =
    attention.anamnesis ||
    attention.examFindings ||
    attention.diagnosis ||
    attention.treatment ||
    attention.heartRate != null ||
    attention.respRate != null ||
    attention.mucous;

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
        {(attention.petId ||
          attention.weightGrams != null ||
          attention.temperature ||
          vet) && (
          <Card className="flex flex-wrap items-center gap-x-6 gap-y-1.5 p-5 text-sm text-gray-600">
            {attention.petId && (
              <Link
                href={`/mascotas/${attention.petId}`}
                className="font-medium text-primary-600 hover:underline"
              >
                Ver ficha de {attention.petName} →
              </Link>
            )}
            {vet && (
              <span>
                <span className="text-gray-400">Atendió: </span>
                {vet.name}
              </span>
            )}
            {attention.weightGrams != null && (
              <span>
                <span className="text-gray-400">Peso: </span>
                {(attention.weightGrams / 1000).toLocaleString("es-CL", {
                  maximumFractionDigits: 2,
                })}{" "}
                kg
              </span>
            )}
            {attention.temperature && (
              <span>
                <span className="text-gray-400">Temp: </span>
                {attention.temperature} °C
              </span>
            )}
            {attention.heartRate != null && (
              <span>
                <span className="text-gray-400">FC: </span>
                {attention.heartRate} lpm
              </span>
            )}
            {attention.respRate != null && (
              <span>
                <span className="text-gray-400">FR: </span>
                {attention.respRate} rpm
              </span>
            )}
            {attention.mucous && (
              <span>
                <span className="text-gray-400">Mucosas: </span>
                {attention.mucous}
              </span>
            )}
          </Card>
        )}

        {(hasClinical || canClinical) && (
          <Card className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Ficha clínica</h2>
              {canClinical && (
                <Link
                  href={`/atenciones/${attention.id}/editar`}
                  className="text-sm font-medium text-primary-600 hover:underline"
                >
                  Editar
                </Link>
              )}
            </div>
            {hasClinical ? (
              <dl className="space-y-2 text-sm">
                <ClinicalRow label="Anamnesis" value={attention.anamnesis} />
                <ClinicalRow label="Examen físico" value={attention.examFindings} />
                <ClinicalRow label="Diagnóstico" value={attention.diagnosis} />
                <ClinicalRow label="Tratamiento" value={attention.treatment} />
              </dl>
            ) : (
              <p className="text-sm text-gray-400">Sin ficha clínica registrada.</p>
            )}
          </Card>
        )}

        {attention.notes && (
          <Card className="p-5">
            <h2 className="mb-1 text-sm font-semibold text-gray-700">Notas</h2>
            <p className="text-sm whitespace-pre-wrap text-gray-600">
              {attention.notes}
            </p>
          </Card>
        )}

        {canClinical && attention.petId && (
          <Card className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recetas</h2>
              <ButtonLink
                href={`/recetas/nueva?pet=${attention.petId}&attention=${attention.id}`}
                variant="secondary"
              >
                + Nueva receta
              </ButtonLink>
            </div>
            <a
              href={`/atenciones/${attention.id}/certificado/pdf`}
              className="inline-block text-sm font-medium text-primary-600 hover:underline"
            >
              Descargar certificado de salud (PDF) →
            </a>
            {prescriptionList.length === 0 ? (
              <p className="text-sm text-gray-400">Sin recetas emitidas.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {prescriptionList.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 py-2 text-sm"
                  >
                    <span className="text-gray-700">
                      Receta {formatDate(p.date)}
                      <span className="text-gray-400"> · {p.count} medicamento{p.count === 1 ? "" : "s"}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <a
                        href={`/recetas/${p.id}/pdf`}
                        className="font-medium text-primary-600 hover:underline"
                      >
                        Descargar PDF
                      </a>
                      <DeleteButton
                        action={deletePrescription.bind(null, p.id)}
                        confirmTitle="¿Eliminar receta?"
                      />
                    </span>
                  </li>
                ))}
              </ul>
            )}
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

        <Card className="space-y-1.5 p-5">
          {attention.discount > 0 && (
            <>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span className="tabular-nums">
                  {formatCurrency(attention.total + attention.discount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Descuento</span>
                <span className="font-medium text-red-600 tabular-nums">
                  −{formatCurrency(attention.discount)}
                </span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700">Total</span>
            <span className="text-2xl font-bold text-primary-700 tabular-nums">
              {formatCurrency(attention.total)}
            </span>
          </div>
        </Card>

        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Pagos</h2>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          {paymentList.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {paymentList.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 py-2 text-sm"
                >
                  <span className="text-gray-700">
                    {formatDate(p.date)}
                    <span className="text-gray-400">
                      {" · "}
                      {PAYMENT_METHOD_LABELS[p.method as PaymentMethod] ?? p.method}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 tabular-nums">
                      {formatCurrency(p.amount)}
                    </span>
                    <DeleteButton
                      action={deletePayment.bind(null, p.id, attention.id)}
                      confirmTitle="¿Eliminar pago?"
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-sm">
            <span className="text-gray-500">
              Pagado {formatCurrency(paid)}
            </span>
            <span
              className={`font-semibold tabular-nums ${
                remaining > 0 ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {remaining > 0
                ? `Saldo ${formatCurrency(remaining)}`
                : "Sin saldo pendiente"}
            </span>
          </div>
          {remaining > 0 && (
            <>
              <form action={markAttentionPaid.bind(null, attention.id)}>
                <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                  Marcar como pagada ({formatCurrency(remaining)})
                </button>
              </form>
              <details>
                <summary className="cursor-pointer text-sm text-gray-500">
                  Registrar pago parcial
                </summary>
                <div className="mt-2">
                  <PaymentForm
                    key={paymentList.length}
                    attentionId={attention.id}
                    remaining={remaining}
                    today={today()}
                  />
                </div>
              </details>
            </>
          )}
        </Card>
      </div>
    </>
  );
}

function ClinicalRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-semibold text-gray-500">{label}</dt>
      <dd className="whitespace-pre-wrap text-gray-700">{value}</dd>
    </div>
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
