"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, expenses } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { MANUAL_EXPENSE_CATEGORIES } from "@/lib/constants";

export type ActionState = { error?: string };

function parseExpense(formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "otro");
  const amount = Math.round(Number(formData.get("amount") ?? 0));
  const date = String(formData.get("date") ?? "").slice(0, 10);

  if (!description) return { error: "La descripción es obligatoria" as const };
  if (!(MANUAL_EXPENSE_CATEGORIES as readonly string[]).includes(category))
    return { error: "Categoría inválida" as const };
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: "El monto debe ser mayor a cero" as const };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    return { error: "La fecha es obligatoria" as const };
  return { data: { description, category, amount, date } };
}

export async function createExpense(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await verifySession())) redirect("/login");

  const parsed = parseExpense(formData);
  if ("error" in parsed) return { error: parsed.error };

  db.insert(expenses).values(parsed.data).run();
  revalidatePath("/gastos");
  redirect("/gastos");
}

export async function updateExpense(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await verifySession())) redirect("/login");

  const parsed = parseExpense(formData);
  if ("error" in parsed) return { error: parsed.error };

  // Solo gastos manuales: los de pedidos (orderId) no se editan
  db.update(expenses)
    .set(parsed.data)
    .where(and(eq(expenses.id, id), isNull(expenses.orderId)))
    .run();
  revalidatePath("/gastos");
  redirect("/gastos");
}

export async function deleteExpense(id: number) {
  if (!(await verifySession())) redirect("/login");

  db.delete(expenses)
    .where(and(eq(expenses.id, id), isNull(expenses.orderId)))
    .run();
  revalidatePath("/gastos");
}
