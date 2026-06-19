"use server";

import { eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  db,
  attentions,
  attentionProducts,
  attentionServices,
  appointments,
  payments,
  petHealthRecords,
  pets,
  products,
  services,
  tutors,
} from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { computeDiscount, parseDiscountType } from "@/lib/discount";
import { addDays } from "@/lib/dates";
import { PAYMENT_METHODS } from "@/lib/constants";

export type ActionState = { error?: string };

type ItemsPayload = {
  services: { serviceId: number; quantity: number }[];
  products: { productId: number; quantity: number }[];
};

function parseItems(raw: string): ItemsPayload | null {
  try {
    const parsed = JSON.parse(raw) as ItemsPayload;
    const valid = (arr: { quantity: number }[], idKey: "serviceId" | "productId") =>
      Array.isArray(arr) &&
      arr.every(
        (item) =>
          Number.isInteger((item as Record<string, number>)[idKey]) &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0
      );
    if (!valid(parsed.services, "serviceId") || !valid(parsed.products, "productId"))
      return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function createAttention(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const me = await verifySession();
  if (!me) redirect("/login");

  let petName = String(formData.get("petName") ?? "").trim();
  let ownerName = String(formData.get("ownerName") ?? "").trim();
  const date = String(formData.get("date") ?? "").slice(0, 10);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const items = parseItems(String(formData.get("items") ?? ""));

  const petId = Number(formData.get("petId")) || null;
  let tutorId = Number(formData.get("tutorId")) || null;
  const vetId = Number(formData.get("vetId")) || null;
  const temperature = String(formData.get("temperature") ?? "").trim() || null;
  const weightKg = Number(formData.get("weightKg") ?? 0);
  const weightGrams =
    Number.isFinite(weightKg) && weightKg > 0 ? Math.round(weightKg * 1000) : null;
  const heartRate = Number(formData.get("heartRate")) || null;
  const respRate = Number(formData.get("respRate")) || null;
  const mucous = String(formData.get("mucous") ?? "").trim() || null;
  const anamnesis = String(formData.get("anamnesis") ?? "").trim() || null;
  const examFindings = String(formData.get("examFindings") ?? "").trim() || null;
  const diagnosis = String(formData.get("diagnosis") ?? "").trim() || null;
  const treatment = String(formData.get("treatment") ?? "").trim() || null;
  const appointmentId = Number(formData.get("appointmentId")) || null;
  const nextVisitDate = String(formData.get("nextVisitDate") ?? "").slice(0, 10) || null;
  const nextVisitNote = String(formData.get("nextVisitNote") ?? "").trim() || null;
  const paid = formData.get("paid") === "on";
  const paymentMethodRaw = String(formData.get("paymentMethod") ?? "efectivo");
  const paymentMethod = (PAYMENT_METHODS as readonly string[]).includes(
    paymentMethodRaw
  )
    ? paymentMethodRaw
    : "efectivo";

  // En modo completo el paciente viene por ficha: resolver nombres desde la BD
  if (petId) {
    const pet = db.select().from(pets).where(eq(pets.id, petId)).get();
    if (!pet) return { error: "La mascota seleccionada ya no existe" };
    petName = pet.name;
    tutorId = pet.tutorId;
    const owner = db
      .select({ name: tutors.name })
      .from(tutors)
      .where(eq(tutors.id, pet.tutorId))
      .get();
    ownerName = owner?.name ?? ownerName;
  }

  if (!petName) return { error: "El nombre de la mascota es obligatorio" };
  if (!ownerName) return { error: "El nombre del dueño es obligatorio" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "La fecha es obligatoria" };
  if (!items) return { error: "Los ítems de la atención no son válidos" };
  if (items.services.length === 0 && items.products.length === 0)
    return { error: "Agrega al menos un servicio o producto" };

  // Precios snapshot desde la BD: nunca confiar en montos del cliente
  const serviceRows = items.services.length
    ? db
        .select()
        .from(services)
        .where(inArray(services.id, items.services.map((s) => s.serviceId)))
        .all()
    : [];
  const productRows = items.products.length
    ? db
        .select()
        .from(products)
        .where(inArray(products.id, items.products.map((p) => p.productId)))
        .all()
    : [];

  if (serviceRows.length !== new Set(items.services.map((s) => s.serviceId)).size)
    return { error: "Alguno de los servicios ya no existe" };
  if (productRows.length !== new Set(items.products.map((p) => p.productId)).size)
    return { error: "Alguno de los productos ya no existe" };

  const servicePrice = new Map(serviceRows.map((s) => [s.id, s.price]));
  const productInfo = new Map(productRows.map((p) => [p.id, p]));

  const subtotal =
    items.services.reduce(
      (sum, s) => sum + s.quantity * (servicePrice.get(s.serviceId) ?? 0),
      0
    ) +
    items.products.reduce(
      (sum, p) => sum + p.quantity * (productInfo.get(p.productId)?.salePrice ?? 0),
      0
    );
  const discount = computeDiscount(
    subtotal,
    parseDiscountType(formData.get("discountType")),
    Number(formData.get("discountValue") ?? 0)
  );
  const total = subtotal - discount;

  try {
    db.transaction((tx) => {
      const attention = tx
        .insert(attentions)
        .values({
          petName,
          ownerName,
          tutorId,
          petId,
          vetId,
          weightGrams,
          temperature,
          heartRate,
          respRate,
          mucous,
          anamnesis,
          examFindings,
          diagnosis,
          treatment,
          date,
          notes,
          discount,
          total,
        })
        .returning()
        .get();

      if (items.services.length) {
        tx.insert(attentionServices)
          .values(
            items.services.map((s) => ({
              attentionId: attention.id,
              serviceId: s.serviceId,
              quantity: s.quantity,
              unitPrice: servicePrice.get(s.serviceId) ?? 0,
            }))
          )
          .run();
      }

      if (items.products.length) {
        tx.insert(attentionProducts)
          .values(
            items.products.map((p) => ({
              attentionId: attention.id,
              productId: p.productId,
              quantity: p.quantity,
              unitPrice: productInfo.get(p.productId)?.salePrice ?? 0,
            }))
          )
          .run();

        for (const p of items.products) {
          const result = tx
            .update(products)
            .set({
              stock: sql`${products.stock} - ${p.quantity}`,
              tracked: true,
              updatedAt: sql`(datetime('now'))`,
            })
            .where(
              sql`${products.id} = ${p.productId} and ${products.stock} >= ${p.quantity}`
            )
            .run();
          if (result.changes === 0) {
            const name = productInfo.get(p.productId)?.name ?? "producto";
            throw new Error(`STOCK:${name}`);
          }
        }
      }

      // Ficha: actualizar peso actual y registrar vacunas/antiparasitarios
      if (petId) {
        if (weightGrams) {
          tx.update(pets)
            .set({ weightGrams })
            .where(eq(pets.id, petId))
            .run();
        }
        if (nextVisitDate && /^\d{4}-\d{2}-\d{2}$/.test(nextVisitDate)) {
          tx.update(pets)
            .set({ nextVisitDate, nextVisitNote })
            .where(eq(pets.id, petId))
            .run();
        }
        for (const p of items.products) {
          const product = productInfo.get(p.productId);
          if (!product) continue;
          if (product.category === "vacuna" || product.category === "antiparasitario") {
            const nextDueDate = addDays(
              date,
              product.category === "vacuna" ? 365 : 30
            );
            tx.insert(petHealthRecords)
              .values({
                petId,
                type: product.category,
                name: product.name,
                appliedDate: date,
                nextDueDate,
                attentionId: attention.id,
              })
              .run();
          }
        }
      }

      if (appointmentId) {
        tx.update(appointments)
          .set({ status: "completada", attentionId: attention.id })
          .where(eq(appointments.id, appointmentId))
          .run();
      }

      // Pago inmediato: registra el total como pagado
      if (paid && total > 0) {
        tx.insert(payments)
          .values({
            attentionId: attention.id,
            amount: total,
            method: paymentMethod,
            date,
            userId: me.uid,
          })
          .run();
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.startsWith("STOCK:")) {
      return { error: `Stock insuficiente para ${message.slice(6)}` };
    }
    throw err;
  }

  revalidatePath("/atenciones");
  revalidatePath("/inventario");
  revalidatePath("/clientes");
  revalidatePath("/agenda");
  revalidatePath("/recordatorios");
  if (petId) revalidatePath(`/mascotas/${petId}`);
  revalidatePath("/");
  redirect("/atenciones");
}

export async function updateAttentionClinical(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const me = await verifySession();
  if (!me) redirect("/login");
  if (me.role === "recepcion")
    return { error: "No tienes permiso para editar la ficha clínica" };

  const vetId = Number(formData.get("vetId")) || null;
  const weightKg = Number(formData.get("weightKg") ?? 0);
  const weightGrams =
    Number.isFinite(weightKg) && weightKg > 0 ? Math.round(weightKg * 1000) : null;
  const temperature = String(formData.get("temperature") ?? "").trim() || null;
  const heartRate = Number(formData.get("heartRate")) || null;
  const respRate = Number(formData.get("respRate")) || null;
  const mucous = String(formData.get("mucous") ?? "").trim() || null;
  const anamnesis = String(formData.get("anamnesis") ?? "").trim() || null;
  const examFindings = String(formData.get("examFindings") ?? "").trim() || null;
  const diagnosis = String(formData.get("diagnosis") ?? "").trim() || null;
  const treatment = String(formData.get("treatment") ?? "").trim() || null;

  const current = db.select().from(attentions).where(eq(attentions.id, id)).get();
  if (!current) return { error: "La atención no existe" };

  db.update(attentions)
    .set({
      vetId,
      weightGrams,
      temperature,
      heartRate,
      respRate,
      mucous,
      anamnesis,
      examFindings,
      diagnosis,
      treatment,
    })
    .where(eq(attentions.id, id))
    .run();

  if (current.petId && weightGrams) {
    db.update(pets)
      .set({ weightGrams })
      .where(eq(pets.id, current.petId))
      .run();
    revalidatePath(`/mascotas/${current.petId}`);
  }

  revalidatePath(`/atenciones/${id}`);
  redirect(`/atenciones/${id}`);
}

export async function deleteAttention(id: number) {
  if (!(await verifySession())) redirect("/login");

  db.transaction((tx) => {
    // Devolver el stock de los productos vendidos
    const lines = tx
      .select()
      .from(attentionProducts)
      .where(eq(attentionProducts.attentionId, id))
      .all();
    for (const line of lines) {
      tx.update(products)
        .set({
          stock: sql`${products.stock} + ${line.quantity}`,
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(products.id, line.productId))
        .run();
    }
    tx.delete(attentions).where(eq(attentions.id, id)).run();
  });

  revalidatePath("/atenciones");
  revalidatePath("/inventario");
  revalidatePath("/");
}
