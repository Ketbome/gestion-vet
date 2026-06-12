import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull().default("otro"),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(0),
  costPrice: integer("cost_price").notNull().default(0),
  salePrice: integer("sale_price").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  // En uso: tiene historial (creado/editado por el usuario, pedido o vendido).
  // Los del catálogo seed parten en false: solo alimentan el autocomplete.
  tracked: integer("tracked", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  price: integer("price").notNull().default(0),
  description: text("description"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const attentions = sqliteTable("attentions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  petName: text("pet_name").notNull(),
  ownerName: text("owner_name").notNull(),
  date: text("date").notNull(),
  notes: text("notes"),
  // Descuento ya aplicado, en pesos: total = suma de líneas - discount
  discount: integer("discount").notNull().default(0),
  total: integer("total").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const attentionServices = sqliteTable("attention_services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  attentionId: integer("attention_id")
    .notNull()
    .references(() => attentions.id, { onDelete: "cascade" }),
  serviceId: integer("service_id")
    .notNull()
    .references(() => services.id),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull().default(0),
});

export const attentionProducts = sqliteTable("attention_products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  attentionId: integer("attention_id")
    .notNull()
    .references(() => attentions.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull().default(0),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  supplier: text("supplier").notNull().default(""),
  status: text("status").notNull().default("pedido"),
  notes: text("notes"),
  // Descuento ya aplicado, en pesos: totalCost = suma de ítems - discount
  discount: integer("discount").notNull().default(0),
  totalCost: integer("total_cost").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  receivedAt: text("received_at"),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  unitCost: integer("unit_cost").notNull().default(0),
});

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: text("category").notNull().default("otro"),
  description: text("description").notNull(),
  amount: integer("amount").notNull().default(0),
  date: text("date").notNull(),
  orderId: integer("order_id").references(() => orders.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Product = typeof products.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Attention = typeof attentions.$inferSelect;
export type AttentionService = typeof attentionServices.$inferSelect;
export type AttentionProduct = typeof attentionProducts.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
