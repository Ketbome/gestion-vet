"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  db,
  hospitalizations,
  hospitalizationLogs,
  hospitalizationCharges,
  payments,
  pets,
  products,
} from "@/lib/db";
import { verifySession, getCurrentUser } from "@/lib/auth";
import { today } from "@/lib/dates";
import { PAYMENT_METHODS } from "@/lib/constants";

export type ActionState = { error?: string; ok?: boolean };

function recomputeTotal(id: number) {
  const [{ total }] = db.all<{ total: number }>(
    sql`select coalesce(sum(quantity * unit_price), 0) as total from ${hospitalizationCharges} where hospitalization_id = ${id}`
  );
  db.update(hospitalizations).set({ total }).where(eq(hospitalizations.id, id)).run();
}

export async function createHospitalization(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const me = await verifySession();
  if (!me) redirect("/login");

  const petId = Number(formData.get("petId")) || null;
  const vetId = Number(formData.get("vetId")) || null;
  const admittedAt = String(formData.get("admittedAt") ?? "").slice(0, 10);
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const diagnosis = String(formData.get("diagnosis") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!petId) return { error: "Selecciona la mascota a hospitalizar" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(admittedAt))
    return { error: "La fecha de ingreso es obligatoria" };

  const pet = db.select().from(pets).where(eq(pets.id, petId)).get();
  if (!pet) return { error: "La mascota seleccionada ya no existe" };

  const hosp = db
    .insert(hospitalizations)
    .values({
      petId,
      tutorId: pet.tutorId,
      vetId,
      admittedAt,
      reason,
      diagnosis,
      notes,
    })
    .returning()
    .get();

  revalidatePath("/hospitalizaciones");
  revalidatePath(`/mascotas/${petId}`);
  revalidatePath("/");
  redirect(`/hospitalizaciones/${hosp.id}`);
}

export async function addHospitalizationLog(
  hospitalizationId: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await verifySession())) redirect("/login");

  const hosp = db
    .select({ status: hospitalizations.status })
    .from(hospitalizations)
    .where(eq(hospitalizations.id, hospitalizationId))
    .get();
  if (!hosp) return { error: "La hospitalización no existe" };
  if (hosp.status !== "activa")
    return { error: "La hospitalización ya está dada de alta" };

  const date = String(formData.get("date") ?? "").slice(0, 10);
  const weightKg = Number(formData.get("weightKg") ?? 0);
  const weightGrams =
    Number.isFinite(weightKg) && weightKg > 0 ? Math.round(weightKg * 1000) : null;
  const temperature = String(formData.get("temperature") ?? "").trim() || null;
  const heartRate = Number(formData.get("heartRate")) || null;
  const respRate = Number(formData.get("respRate")) || null;
  const treatment = String(formData.get("treatment") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "La fecha es obligatoria" };
  if (!treatment && !notes && !temperature && !weightGrams && !heartRate && !respRate)
    return { error: "Registra al menos un dato de la evolución" };

  db.insert(hospitalizationLogs)
    .values({
      hospitalizationId,
      date,
      weightGrams,
      temperature,
      heartRate,
      respRate,
      treatment,
      notes,
    })
    .run();

  revalidatePath(`/hospitalizaciones/${hospitalizationId}`);
  return { ok: true };
}

export async function addHospitalizationCharge(
  hospitalizationId: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await verifySession())) redirect("/login");

  const hosp = db
    .select({ status: hospitalizations.status })
    .from(hospitalizations)
    .where(eq(hospitalizations.id, hospitalizationId))
    .get();
  if (!hosp) return { error: "La hospitalización no existe" };
  if (hosp.status !== "activa")
    return { error: "La hospitalización ya está dada de alta" };

  const productId = Number(formData.get("productId")) || null;
  const quantity = Math.round(Number(formData.get("quantity") ?? 1));
  if (!Number.isFinite(quantity) || quantity <= 0)
    return { error: "La cantidad debe ser mayor a 0" };

  try {
    if (productId) {
      const product = db.select().from(products).where(eq(products.id, productId)).get();
      if (!product) return { error: "El producto ya no existe" };

      db.transaction((tx) => {
        const result = tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${quantity}`,
            tracked: true,
            updatedAt: sql`(datetime('now'))`,
          })
          .where(sql`${products.id} = ${productId} and ${products.stock} >= ${quantity}`)
          .run();
        if (result.changes === 0) throw new Error(`STOCK:${product.name}`);

        tx.insert(hospitalizationCharges)
          .values({
            hospitalizationId,
            productId,
            description: product.name,
            quantity,
            unitPrice: product.salePrice,
          })
          .run();
      });
    } else {
      const description = String(formData.get("description") ?? "").trim();
      const unitPrice = Math.round(Number(formData.get("unitPrice") ?? 0));
      if (!description) return { error: "Falta la descripción del cargo" };
      if (!Number.isFinite(unitPrice) || unitPrice <= 0)
        return { error: "El monto debe ser mayor a 0" };

      db.insert(hospitalizationCharges)
        .values({ hospitalizationId, description, quantity, unitPrice })
        .run();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.startsWith("STOCK:"))
      return { error: `Stock insuficiente para ${message.slice(6)}` };
    throw err;
  }

  recomputeTotal(hospitalizationId);
  revalidatePath(`/hospitalizaciones/${hospitalizationId}`);
  revalidatePath("/inventario");
  return { ok: true };
}

export async function removeHospitalizationCharge(
  id: number,
  hospitalizationId: number
) {
  if (!(await verifySession())) redirect("/login");

  const charge = db
    .select()
    .from(hospitalizationCharges)
    .where(eq(hospitalizationCharges.id, id))
    .get();
  if (!charge) return;

  db.transaction((tx) => {
    if (charge.productId) {
      tx.update(products)
        .set({
          stock: sql`${products.stock} + ${charge.quantity}`,
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(products.id, charge.productId))
        .run();
    }
    tx.delete(hospitalizationCharges).where(eq(hospitalizationCharges.id, id)).run();
  });

  recomputeTotal(hospitalizationId);
  revalidatePath(`/hospitalizaciones/${hospitalizationId}`);
  revalidatePath("/inventario");
}

export async function dischargeHospitalization(id: number) {
  if (!(await verifySession())) redirect("/login");

  db.update(hospitalizations)
    .set({ status: "alta", dischargedAt: today() })
    .where(eq(hospitalizations.id, id))
    .run();

  revalidatePath(`/hospitalizaciones/${id}`);
  revalidatePath("/hospitalizaciones");
  revalidatePath("/");
}

export async function addHospitalizationPayment(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const hospitalizationId = Number(formData.get("hospitalizationId")) || null;
  const amount = Math.round(Number(formData.get("amount") ?? 0));
  const method = String(formData.get("method") ?? "efectivo");
  const date = String(formData.get("date") ?? "").slice(0, 10);

  if (!hospitalizationId) return { error: "Falta la hospitalización" };
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: "El monto debe ser mayor a 0" };
  if (!(PAYMENT_METHODS as readonly string[]).includes(method))
    return { error: "Medio de pago inválido" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "La fecha es obligatoria" };

  db.insert(payments)
    .values({ hospitalizationId, amount, method, date, userId: me.uid })
    .run();

  revalidatePath(`/hospitalizaciones/${hospitalizationId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function markHospitalizationPaid(hospitalizationId: number) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const hosp = db
    .select({ total: hospitalizations.total })
    .from(hospitalizations)
    .where(eq(hospitalizations.id, hospitalizationId))
    .get();
  if (!hosp) return;

  const [{ paid }] = db.all<{ paid: number }>(
    sql`select coalesce(sum(amount), 0) as paid from ${payments} where hospitalization_id = ${hospitalizationId}`
  );
  const remaining = hosp.total - paid;
  if (remaining <= 0) return;

  db.insert(payments)
    .values({
      hospitalizationId,
      amount: remaining,
      method: "efectivo",
      date: today(),
      userId: me.uid,
    })
    .run();

  revalidatePath(`/hospitalizaciones/${hospitalizationId}`);
  revalidatePath("/");
}

export async function deleteHospitalizationPayment(
  id: number,
  hospitalizationId: number
) {
  if (!(await getCurrentUser())) redirect("/login");

  db.delete(payments).where(eq(payments.id, id)).run();
  revalidatePath(`/hospitalizaciones/${hospitalizationId}`);
  revalidatePath("/");
}

export async function deleteHospitalization(id: number) {
  if (!(await verifySession())) redirect("/login");

  const hosp = db
    .select({ petId: hospitalizations.petId })
    .from(hospitalizations)
    .where(eq(hospitalizations.id, id))
    .get();

  db.transaction((tx) => {
    const charges = tx
      .select()
      .from(hospitalizationCharges)
      .where(eq(hospitalizationCharges.hospitalizationId, id))
      .all();
    for (const c of charges) {
      if (c.productId) {
        tx.update(products)
          .set({
            stock: sql`${products.stock} + ${c.quantity}`,
            updatedAt: sql`(datetime('now'))`,
          })
          .where(eq(products.id, c.productId))
          .run();
      }
    }
    tx.delete(hospitalizations).where(eq(hospitalizations.id, id)).run();
  });

  revalidatePath("/hospitalizaciones");
  revalidatePath("/inventario");
  if (hosp) revalidatePath(`/mascotas/${hosp.petId}`);
  revalidatePath("/");
  redirect("/hospitalizaciones");
}
