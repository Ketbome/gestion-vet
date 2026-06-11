"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, products } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

export type ActionState = { error?: string };

function parseProduct(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "otro");
  const stock = Math.round(Number(formData.get("stock") ?? 0));
  const minStock = Math.round(Number(formData.get("minStock") ?? 0));
  const costPrice = Math.round(Number(formData.get("costPrice") ?? 0));
  const salePrice = Math.round(Number(formData.get("salePrice") ?? 0));

  if (!name) return { error: "El nombre es obligatorio" as const };
  if (!(PRODUCT_CATEGORIES as readonly string[]).includes(category))
    return { error: "Categoría inválida" as const };
  for (const [label, value] of [
    ["stock", stock],
    ["stock mínimo", minStock],
    ["precio de costo", costPrice],
    ["precio de venta", salePrice],
  ] as const) {
    if (!Number.isFinite(value) || value < 0)
      return { error: `El ${label} debe ser un número válido` as const };
  }
  // Crear o editar un producto lo marca como "en uso"
  return {
    data: { name, category, stock, minStock, costPrice, salePrice, tracked: true },
  };
}

export async function createProduct(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await verifySession())) redirect("/login");

  const parsed = parseProduct(formData);
  if ("error" in parsed) return { error: parsed.error };

  db.insert(products).values(parsed.data).run();
  revalidatePath("/inventario");
  redirect("/inventario");
}

export async function updateProduct(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await verifySession())) redirect("/login");

  const parsed = parseProduct(formData);
  if ("error" in parsed) return { error: parsed.error };

  db.update(products)
    .set({ ...parsed.data, updatedAt: sql`(datetime('now'))` })
    .where(eq(products.id, id))
    .run();
  revalidatePath("/inventario");
  redirect("/inventario");
}

export async function deleteProduct(id: number) {
  if (!(await verifySession())) redirect("/login");

  // Soft delete: atenciones y pedidos antiguos siguen referenciándolo
  db.update(products)
    .set({ active: false, updatedAt: sql`(datetime('now'))` })
    .where(eq(products.id, id))
    .run();
  revalidatePath("/inventario");
}
