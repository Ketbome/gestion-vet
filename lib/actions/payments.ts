"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, payments, attentions } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { today } from "@/lib/dates";
import { PAYMENT_METHODS } from "@/lib/constants";

export type ActionState = { error?: string; ok?: boolean };

export async function addPayment(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const attentionId = Number(formData.get("attentionId")) || null;
  const amount = Math.round(Number(formData.get("amount") ?? 0));
  const method = String(formData.get("method") ?? "efectivo");
  const date = String(formData.get("date") ?? "").slice(0, 10);

  if (!attentionId) return { error: "Falta la atención" };
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: "El monto debe ser mayor a 0" };
  if (!(PAYMENT_METHODS as readonly string[]).includes(method))
    return { error: "Medio de pago inválido" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "La fecha es obligatoria" };

  const attention = db
    .select({ id: attentions.id, petId: attentions.petId })
    .from(attentions)
    .where(eq(attentions.id, attentionId))
    .get();
  if (!attention) return { error: "La atención no existe" };

  db.insert(payments)
    .values({ attentionId, amount, method, date, userId: me.uid })
    .run();

  revalidatePath(`/atenciones/${attentionId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function markAttentionPaid(attentionId: number) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const attention = db
    .select({ total: attentions.total })
    .from(attentions)
    .where(eq(attentions.id, attentionId))
    .get();
  if (!attention) return;

  const [{ paid }] = db.all<{ paid: number }>(
    sql`select coalesce(sum(amount), 0) as paid from ${payments} where attention_id = ${attentionId}`
  );
  const remaining = attention.total - paid;
  if (remaining <= 0) return;

  db.insert(payments)
    .values({
      attentionId,
      amount: remaining,
      method: "efectivo",
      date: today(),
      userId: me.uid,
    })
    .run();

  revalidatePath(`/atenciones/${attentionId}`);
  revalidatePath("/");
}

export async function deletePayment(id: number, attentionId: number) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  db.delete(payments).where(eq(payments.id, id)).run();
  revalidatePath(`/atenciones/${attentionId}`);
  revalidatePath("/");
}
