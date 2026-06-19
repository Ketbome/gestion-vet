import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import {
  db,
  hospitalizations,
  hospitalizationLogs,
  hospitalizationCharges,
  payments,
  pets,
  products,
  tutors,
  users,
} from "@/lib/db";
import { getClinicMode } from "@/lib/settings";
import { formatCurrency } from "@/lib/currency";
import { formatDate, today } from "@/lib/dates";
import {
  PAYMENT_METHOD_LABELS,
  paymentStatus,
  type PaymentMethod,
} from "@/lib/constants";
import {
  dischargeHospitalization,
  deleteHospitalization,
  removeHospitalizationCharge,
  markHospitalizationPaid,
  deleteHospitalizationPayment,
} from "@/lib/actions/hospitalizations";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { LogForm } from "@/components/hospitalizaciones/log-form";
import { ChargeForm } from "@/components/hospitalizaciones/charge-form";
import { HospitalizationPaymentForm } from "@/components/hospitalizaciones/payment-form";
import { VitalsChart } from "@/components/hospitalizaciones/vitals-chart";

export const metadata: Metadata = { title: "Hospitalización" };

function daysBetween(from: string, to: string) {
  const [y1, m1, d1] = from.slice(0, 10).split("-").map(Number);
  const [y2, m2, d2] = to.slice(0, 10).split("-").map(Number);
  const a = new Date(y1, m1 - 1, d1).getTime();
  const b = new Date(y2, m2 - 1, d2).getTime();
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

export default async function HospitalizacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (getClinicMode() !== "completo") redirect("/");

  const { id } = await params;
  const hosp = db
    .select()
    .from(hospitalizations)
    .where(eq(hospitalizations.id, Number(id)))
    .get();
  if (!hosp) notFound();

  const active = hosp.status === "activa";
  const pet = db.select().from(pets).where(eq(pets.id, hosp.petId)).get();
  const tutor = hosp.tutorId
    ? db.select({ id: tutors.id, name: tutors.name }).from(tutors).where(eq(tutors.id, hosp.tutorId)).get()
    : null;
  const vet = hosp.vetId
    ? db.select({ name: users.name }).from(users).where(eq(users.id, hosp.vetId)).get()
    : null;

  const logs = db
    .select()
    .from(hospitalizationLogs)
    .where(eq(hospitalizationLogs.hospitalizationId, hosp.id))
    .orderBy(desc(hospitalizationLogs.date), desc(hospitalizationLogs.id))
    .all();

  const charges = db
    .select()
    .from(hospitalizationCharges)
    .where(eq(hospitalizationCharges.hospitalizationId, hosp.id))
    .orderBy(asc(hospitalizationCharges.id))
    .all();

  const paymentList = db
    .select()
    .from(payments)
    .where(eq(payments.hospitalizationId, hosp.id))
    .orderBy(desc(payments.date))
    .all();
  const paid = paymentList.reduce((sum, p) => sum + p.amount, 0);
  const remaining = hosp.total - paid;
  const status = paymentStatus(hosp.total, paid);

  const productOptions = active
    ? db
        .select({
          id: products.id,
          name: products.name,
          stock: products.stock,
          salePrice: products.salePrice,
          costPrice: products.costPrice,
        })
        .from(products)
        .where(eq(products.active, true))
        .orderBy(asc(products.name))
        .all()
    : [];

  const days = daysBetween(hosp.admittedAt, hosp.dischargedAt ?? today());

  const vitals = [...logs]
    .reverse()
    .map((l) => ({
      date: l.date,
      temp: l.temperature ? Number(l.temperature) : null,
      weight: l.weightGrams != null ? l.weightGrams / 1000 : null,
    }))
    .filter((p) => p.temp != null || p.weight != null);
  const showVitals = vitals.length >= 2;

  return (
    <>
      <PageHeader
        title={pet?.name ?? "Paciente"}
        subtitle={`${tutor?.name ?? "Sin tutor"} · Ingreso ${formatDate(hosp.admittedAt)}`}
        backHref="/hospitalizaciones"
        backLabel="Hospitalización"
        action={
          <div className="flex items-center gap-2">
            <Badge variant={active ? "amber" : "gray"}>
              {active ? `Día ${days}` : "Dada de alta"}
            </Badge>
            <DeleteButton
              action={deleteHospitalization.bind(null, hosp.id)}
              confirmMessage="¿Eliminar esta hospitalización? El stock de los productos cargados se devolverá al inventario."
            >
              Eliminar
            </DeleteButton>
          </div>
        }
      />

      <div className="max-w-2xl space-y-4">
        <Card className="space-y-1.5 p-5 text-sm text-gray-600">
          {pet && (
            <p>
              <Link
                href={`/mascotas/${pet.id}`}
                className="font-medium text-primary-600 hover:underline"
              >
                Ver ficha de {pet.name} →
              </Link>
            </p>
          )}
          {vet && (
            <p>
              <span className="text-gray-400">Veterinario: </span>
              {vet.name}
            </p>
          )}
          {hosp.reason && (
            <p>
              <span className="text-gray-400">Motivo: </span>
              <span className="whitespace-pre-wrap">{hosp.reason}</span>
            </p>
          )}
          {hosp.diagnosis && (
            <p>
              <span className="text-gray-400">Diagnóstico: </span>
              <span className="whitespace-pre-wrap">{hosp.diagnosis}</span>
            </p>
          )}
          {hosp.dischargedAt && (
            <p>
              <span className="text-gray-400">Alta: </span>
              {formatDate(hosp.dischargedAt)}
            </p>
          )}
          {hosp.notes && <p className="whitespace-pre-wrap">{hosp.notes}</p>}
        </Card>

        {active && (
          <form action={dischargeHospitalization.bind(null, hosp.id)}>
            <button className="w-full rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
              Dar de alta
            </button>
          </form>
        )}

        <Card className="space-y-3 p-5">
          <h2 className="font-semibold text-gray-900">Evolución diaria</h2>
          {showVitals && <VitalsChart points={vitals} />}
          {logs.length === 0 ? (
            <p className="text-sm text-gray-400">Aún no hay registros de evolución.</p>
          ) : (
            <ul className="space-y-3">
              {logs.map((l) => (
                <li key={l.id} className="border-l-2 border-primary-200 pl-3">
                  <p className="text-xs font-semibold text-gray-500">
                    {formatDate(l.date)}
                    <span className="ml-2 font-normal text-gray-400">
                      {[
                        l.weightGrams != null
                          ? `${(l.weightGrams / 1000).toLocaleString("es-CL", { maximumFractionDigits: 2 })} kg`
                          : null,
                        l.temperature ? `${l.temperature} °C` : null,
                        l.heartRate != null ? `${l.heartRate} lpm` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </p>
                  {l.treatment && (
                    <p className="text-sm whitespace-pre-wrap text-gray-700">{l.treatment}</p>
                  )}
                  {l.notes && (
                    <p className="text-sm whitespace-pre-wrap text-gray-500">{l.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {active && (
            <LogForm key={logs.length} hospitalizationId={hosp.id} today={today()} />
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <h2 className="font-semibold text-gray-900">Cargos</h2>
          {charges.length === 0 ? (
            <p className="text-sm text-gray-400">Sin cargos registrados.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {charges.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="min-w-0 truncate text-gray-700">
                    {c.description}
                    {c.quantity > 1 && <span className="text-gray-400"> × {c.quantity}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-medium text-gray-900 tabular-nums">
                      {formatCurrency(c.unitPrice * c.quantity)}
                    </span>
                    {active && (
                      <DeleteButton
                        action={removeHospitalizationCharge.bind(null, c.id, hosp.id)}
                        confirmTitle="¿Quitar cargo?"
                      />
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between border-t border-gray-100 pt-2">
            <span className="font-semibold text-gray-700">Total</span>
            <span className="text-xl font-bold text-primary-700 tabular-nums">
              {formatCurrency(hosp.total)}
            </span>
          </div>
          {active && (
            <ChargeForm
              key={charges.length}
              hospitalizationId={hosp.id}
              products={productOptions}
            />
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Pagos</h2>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          {paymentList.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {paymentList.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
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
                      action={deleteHospitalizationPayment.bind(null, p.id, hosp.id)}
                      confirmTitle="¿Eliminar pago?"
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-sm">
            <span className="text-gray-500">Pagado {formatCurrency(paid)}</span>
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
              <form action={markHospitalizationPaid.bind(null, hosp.id)}>
                <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                  Marcar como pagada ({formatCurrency(remaining)})
                </button>
              </form>
              <details>
                <summary className="cursor-pointer text-sm text-gray-500">
                  Registrar pago parcial
                </summary>
                <div className="mt-2">
                  <HospitalizationPaymentForm
                    key={paymentList.length}
                    hospitalizationId={hosp.id}
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
