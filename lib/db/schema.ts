import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
  // En modo completo apuntan a la ficha; en básico quedan nulos (texto libre)
  tutorId: integer("tutor_id").references(() => tutors.id),
  petId: integer("pet_id").references(() => pets.id),
  vetId: integer("vet_id").references(() => users.id),
  weightGrams: integer("weight_grams"),
  temperature: text("temperature"),
  heartRate: integer("heart_rate"),
  respRate: integer("resp_rate"),
  mucous: text("mucous"),
  anamnesis: text("anamnesis"),
  examFindings: text("exam_findings"),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
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

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clinicMode: text("clinic_mode").notNull().default("basico"),
  clinicName: text("clinic_name").notNull().default(""),
  publicBookingEnabled: integer("public_booking_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  bookingHoursNote: text("booking_hours_note"),
  slotMinutes: integer("slot_minutes").notNull().default(30),
  ivaEnabled: integer("iva_enabled", { mode: "boolean" }).notNull().default(true),
  ivaRate: real("iva_rate").notNull().default(19),
  logo: text("logo"),
  clinicRut: text("clinic_rut"),
  clinicAddress: text("clinic_address"),
  clinicPhone: text("clinic_phone"),
  clinicEmail: text("clinic_email"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const tutors = sqliteTable("tutors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  rut: text("rut"),
  address: text("address"),
  notes: text("notes"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const pets = sqliteTable("pets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tutorId: integer("tutor_id")
    .notNull()
    .references(() => tutors.id),
  name: text("name").notNull(),
  species: text("species").notNull().default("perro"),
  breed: text("breed"),
  sex: text("sex").notNull().default("desconocido"),
  birthDate: text("birth_date"),
  weightGrams: integer("weight_grams"),
  microchip: text("microchip"),
  color: text("color"),
  allergies: text("allergies"),
  nextVisitDate: text("next_visit_date"),
  nextVisitNote: text("next_visit_note"),
  sterilized: integer("sterilized", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const petHealthRecords = sqliteTable("pet_health_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  petId: integer("pet_id")
    .notNull()
    .references(() => pets.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("vacuna"),
  name: text("name").notNull(),
  appliedDate: text("applied_date").notNull(),
  nextDueDate: text("next_due_date"),
  attentionId: integer("attention_id").references(() => attentions.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const appointments = sqliteTable("appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Si el cliente ya tiene ficha quedan enlazados; en solicitudes públicas
  // sin ficha previa se usan los campos sueltos de tutor/mascota
  tutorId: integer("tutor_id").references(() => tutors.id),
  petId: integer("pet_id").references(() => pets.id),
  tutorName: text("tutor_name").notNull().default(""),
  tutorPhone: text("tutor_phone"),
  tutorEmail: text("tutor_email"),
  petName: text("pet_name").notNull().default(""),
  species: text("species"),
  date: text("date").notNull(),
  time: text("time"),
  reason: text("reason"),
  vetId: integer("vet_id").references(() => users.id),
  durationMin: integer("duration_min").notNull().default(30),
  status: text("status").notNull().default("solicitada"),
  source: text("source").notNull().default("interna"),
  confirmedAt: text("confirmed_at"),
  attentionId: integer("attention_id").references(() => attentions.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("veterinario"),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  color: text("color").notNull().default("#0ea5e9"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const vetSchedules = sqliteTable("vet_schedules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  weekday: integer("weekday").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
});

export const vetBlocks = sqliteTable("vet_blocks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  // Si startTime/endTime quedan nulos, el día completo está bloqueado.
  startTime: text("start_time"),
  endTime: text("end_time"),
  reason: text("reason"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const prescriptions = sqliteTable("prescriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  petId: integer("pet_id")
    .notNull()
    .references(() => pets.id, { onDelete: "cascade" }),
  tutorId: integer("tutor_id").references(() => tutors.id),
  vetId: integer("vet_id").references(() => users.id),
  attentionId: integer("attention_id").references(() => attentions.id, {
    onDelete: "set null",
  }),
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const prescriptionItems = sqliteTable("prescription_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  prescriptionId: integer("prescription_id")
    .notNull()
    .references(() => prescriptions.id, { onDelete: "cascade" }),
  medication: text("medication").notNull(),
  dose: text("dose"),
  frequency: text("frequency"),
  duration: text("duration"),
  instructions: text("instructions"),
});

export const hospitalizations = sqliteTable("hospitalizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  petId: integer("pet_id")
    .notNull()
    .references(() => pets.id, { onDelete: "cascade" }),
  tutorId: integer("tutor_id").references(() => tutors.id),
  vetId: integer("vet_id").references(() => users.id),
  admittedAt: text("admitted_at").notNull(),
  reason: text("reason"),
  diagnosis: text("diagnosis"),
  status: text("status").notNull().default("activa"),
  dischargedAt: text("discharged_at"),
  notes: text("notes"),
  total: integer("total").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const hospitalizationLogs = sqliteTable("hospitalization_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hospitalizationId: integer("hospitalization_id")
    .notNull()
    .references(() => hospitalizations.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  weightGrams: integer("weight_grams"),
  temperature: text("temperature"),
  heartRate: integer("heart_rate"),
  respRate: integer("resp_rate"),
  treatment: text("treatment"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const hospitalizationCharges = sqliteTable("hospitalization_charges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hospitalizationId: integer("hospitalization_id")
    .notNull()
    .references(() => hospitalizations.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  attentionId: integer("attention_id").references(() => attentions.id, {
    onDelete: "cascade",
  }),
  hospitalizationId: integer("hospitalization_id").references(
    () => hospitalizations.id,
    { onDelete: "cascade" }
  ),
  amount: integer("amount").notNull().default(0),
  method: text("method").notNull().default("efectivo"),
  date: text("date").notNull(),
  userId: integer("user_id").references(() => users.id),
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
export type Settings = typeof settings.$inferSelect;
export type Tutor = typeof tutors.$inferSelect;
export type Pet = typeof pets.$inferSelect;
export type PetHealthRecord = typeof petHealthRecords.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type User = typeof users.$inferSelect;
export type VetSchedule = typeof vetSchedules.$inferSelect;
export type VetBlock = typeof vetBlocks.$inferSelect;
export type Prescription = typeof prescriptions.$inferSelect;
export type PrescriptionItem = typeof prescriptionItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Hospitalization = typeof hospitalizations.$inferSelect;
export type HospitalizationLog = typeof hospitalizationLogs.$inferSelect;
export type HospitalizationCharge = typeof hospitalizationCharges.$inferSelect;
