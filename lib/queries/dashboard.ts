import { and, between, desc, eq, gt, lte, ne, sql } from "drizzle-orm";
import {
  db,
  attentions,
  attentionProducts,
  attentionServices,
  expenses,
  orders,
  products,
  services,
} from "@/lib/db";
import type { DateRange } from "@/lib/dates";

export function getDashboardData(range: DateRange) {
  const inRange = between(attentions.date, range.start, range.end);

  const [{ income, attentionCount }] = db
    .select({
      income: sql<number>`coalesce(sum(${attentions.total}), 0)`,
      attentionCount: sql<number>`count(*)`,
    })
    .from(attentions)
    .where(inRange)
    .all();

  const [{ expensesTotal }] = db
    .select({ expensesTotal: sql<number>`coalesce(sum(${expenses.amount}), 0)` })
    .from(expenses)
    .where(between(expenses.date, range.start, range.end))
    .all();

  const topServices = db
    .select({
      name: services.name,
      quantity: sql<number>`sum(${attentionServices.quantity})`,
      total: sql<number>`sum(${attentionServices.quantity} * ${attentionServices.unitPrice})`,
    })
    .from(attentionServices)
    .innerJoin(services, eq(attentionServices.serviceId, services.id))
    .innerJoin(attentions, eq(attentionServices.attentionId, attentions.id))
    .where(inRange)
    .groupBy(attentionServices.serviceId)
    .orderBy(desc(sql`sum(${attentionServices.quantity} * ${attentionServices.unitPrice})`))
    .limit(5)
    .all();

  const topProducts = db
    .select({
      name: products.name,
      quantity: sql<number>`sum(${attentionProducts.quantity})`,
      total: sql<number>`sum(${attentionProducts.quantity} * ${attentionProducts.unitPrice})`,
    })
    .from(attentionProducts)
    .innerJoin(products, eq(attentionProducts.productId, products.id))
    .innerJoin(attentions, eq(attentionProducts.attentionId, attentions.id))
    .where(inRange)
    .groupBy(attentionProducts.productId)
    .orderBy(desc(sql`sum(${attentionProducts.quantity} * ${attentionProducts.unitPrice})`))
    .limit(5)
    .all();

  const recentAttentions = db
    .select()
    .from(attentions)
    .orderBy(desc(attentions.date), desc(attentions.id))
    .limit(5)
    .all();

  const lowStock = db
    .select()
    .from(products)
    .where(
      and(
        eq(products.active, true),
        // Solo productos en uso: el catálogo seed sin historial no alerta
        eq(products.tracked, true),
        gt(products.minStock, 0),
        lte(products.stock, products.minStock)
      )
    )
    .orderBy(sql`${products.stock} - ${products.minStock}`)
    .limit(8)
    .all();

  const pendingOrders = db
    .select()
    .from(orders)
    .where(ne(orders.status, "recibido"))
    .orderBy(desc(orders.id))
    .limit(5)
    .all();

  return {
    income,
    attentionCount,
    expensesTotal,
    profit: income - expensesTotal,
    topServices,
    topProducts,
    recentAttentions,
    lowStock,
    pendingOrders,
  };
}
