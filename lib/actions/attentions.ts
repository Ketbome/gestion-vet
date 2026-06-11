"use server";

import { eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  db,
  attentions,
  attentionProducts,
  attentionServices,
  products,
  services,
} from "@/lib/db";
import { verifySession } from "@/lib/auth";

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
  if (!(await verifySession())) redirect("/login");

  const petName = String(formData.get("petName") ?? "").trim();
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const date = String(formData.get("date") ?? "").slice(0, 10);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const items = parseItems(String(formData.get("items") ?? ""));

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

  const total =
    items.services.reduce(
      (sum, s) => sum + s.quantity * (servicePrice.get(s.serviceId) ?? 0),
      0
    ) +
    items.products.reduce(
      (sum, p) => sum + p.quantity * (productInfo.get(p.productId)?.salePrice ?? 0),
      0
    );

  try {
    db.transaction((tx) => {
      const attention = tx
        .insert(attentions)
        .values({ petName, ownerName, date, notes, total })
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
  revalidatePath("/");
  redirect("/atenciones");
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
