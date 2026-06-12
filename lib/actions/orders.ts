"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, expenses, orderItems, orders, products } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { computeDiscount, parseDiscountType } from "@/lib/discount";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { today } from "@/lib/dates";

export type ActionState = { error?: string };

type OrderItemPayload =
  | { productId: number; quantity: number; unitCost: number }
  | {
      newProduct: { name: string; category: string; salePrice: number };
      quantity: number;
      unitCost: number;
    };

function parseOrderItems(raw: string): OrderItemPayload[] | null {
  try {
    const parsed = JSON.parse(raw) as OrderItemPayload[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    for (const item of parsed) {
      if (
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.unitCost) ||
        item.unitCost < 0
      )
        return null;
      if ("productId" in item) {
        if (!Number.isInteger(item.productId)) return null;
      } else if ("newProduct" in item) {
        const np = item.newProduct;
        if (!np.name?.trim()) return null;
        if (!(PRODUCT_CATEGORIES as readonly string[]).includes(np.category))
          return null;
        if (!Number.isFinite(np.salePrice) || np.salePrice < 0) return null;
      } else {
        return null;
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function createOrder(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await verifySession())) redirect("/login");

  const supplier = String(formData.get("supplier") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const items = parseOrderItems(String(formData.get("items") ?? ""));

  if (!supplier) return { error: "El proveedor es obligatorio" };
  if (!items) return { error: "Agrega al menos un producto al pedido" };

  const subtotal = items.reduce(
    (sum, item) => sum + Math.round(item.unitCost) * item.quantity,
    0
  );
  const discount = computeDiscount(
    subtotal,
    parseDiscountType(formData.get("discountType")),
    Number(formData.get("discountValue") ?? 0)
  );
  const totalCost = subtotal - discount;

  let orderId = 0;
  db.transaction((tx) => {
    const order = tx
      .insert(orders)
      .values({ supplier, notes, discount, totalCost })
      .returning()
      .get();
    orderId = order.id;

    for (const item of items) {
      let productId: number;
      if ("productId" in item) {
        productId = item.productId;
        // Pedir un producto lo marca como "en uso"
        tx.update(products)
          .set({ tracked: true, updatedAt: sql`(datetime('now'))` })
          .where(eq(products.id, productId))
          .run();
      } else {
        // Producto nuevo: entra al catálogo con stock 0 (se suma al recibir)
        const created = tx
          .insert(products)
          .values({
            name: item.newProduct.name.trim(),
            category: item.newProduct.category,
            costPrice: Math.round(item.unitCost),
            salePrice: Math.round(item.newProduct.salePrice),
            tracked: true,
          })
          .returning()
          .get();
        productId = created.id;
      }
      tx.insert(orderItems)
        .values({
          orderId: order.id,
          productId,
          quantity: item.quantity,
          unitCost: Math.round(item.unitCost),
        })
        .run();
    }
  });

  revalidatePath("/pedidos");
  revalidatePath("/inventario");
  redirect(`/pedidos/${orderId}`);
}

export async function markOrderPurchased(id: number) {
  if (!(await verifySession())) redirect("/login");

  db.update(orders)
    .set({ status: "comprado" })
    .where(sql`${orders.id} = ${id} and ${orders.status} = 'pedido'`)
    .run();
  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${id}`);
}

export async function markOrderReceived(id: number) {
  if (!(await verifySession())) redirect("/login");

  db.transaction((tx) => {
    const result = tx
      .update(orders)
      .set({ status: "recibido", receivedAt: sql`(datetime('now'))` })
      .where(sql`${orders.id} = ${id} and ${orders.status} = 'comprado'`)
      .run();
    if (result.changes === 0) return; // ya recibido o estado inválido

    const order = tx.select().from(orders).where(eq(orders.id, id)).get()!;
    const items = tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id))
      .all();

    for (const item of items) {
      tx.update(products)
        .set({
          stock: sql`${products.stock} + ${item.quantity}`,
          costPrice: item.unitCost,
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(products.id, item.productId))
        .run();
    }

    tx.insert(expenses)
      .values({
        category: "pedido",
        description: `Pedido #${order.id} — ${order.supplier}`,
        amount: order.totalCost,
        date: today(),
        orderId: order.id,
      })
      .run();
  });

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${id}`);
  revalidatePath("/inventario");
  revalidatePath("/gastos");
  revalidatePath("/");
}

export async function deleteOrder(id: number) {
  if (!(await verifySession())) redirect("/login");

  // Los pedidos recibidos no se eliminan (ya movieron stock y gastos)
  db.delete(orders)
    .where(sql`${orders.id} = ${id} and ${orders.status} != 'recibido'`)
    .run();
  revalidatePath("/pedidos");
  redirect("/pedidos");
}
