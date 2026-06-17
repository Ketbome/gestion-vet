export const PRODUCT_CATEGORIES = [
  "vacuna",
  "medicamento",
  "antiparasitario",
  "alimento",
  "insumo",
  "otro",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  vacuna: "Vacuna",
  medicamento: "Medicamento",
  antiparasitario: "Antiparasitario",
  alimento: "Alimento",
  insumo: "Insumo",
  otro: "Otro",
};

export const EXPENSE_CATEGORIES = [
  "arriendo",
  "sueldos",
  "insumos",
  "servicios_basicos",
  "pedido",
  "otro",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  arriendo: "Arriendo",
  sueldos: "Sueldos",
  insumos: "Insumos",
  servicios_basicos: "Servicios básicos",
  pedido: "Pedido a proveedor",
  otro: "Otro",
};

// Categorías que el usuario puede elegir al crear un gasto manual
// ("pedido" se reserva para los gastos automáticos de pedidos recibidos)
export const MANUAL_EXPENSE_CATEGORIES = EXPENSE_CATEGORIES.filter(
  (c) => c !== "pedido"
);

export const ORDER_STATUSES = ["pedido", "comprado", "recibido"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pedido: "Pedido",
  comprado: "Comprado",
  recibido: "Recibido",
};

export const CLINIC_MODES = ["basico", "completo"] as const;

export type ClinicMode = (typeof CLINIC_MODES)[number];

export const CLINIC_MODE_LABELS: Record<ClinicMode, string> = {
  basico: "Básico",
  completo: "Completo",
};

export const SPECIES = [
  "perro",
  "gato",
  "conejo",
  "ave",
  "roedor",
  "reptil",
  "otro",
] as const;

export type Species = (typeof SPECIES)[number];

export const SPECIES_LABELS: Record<Species, string> = {
  perro: "Perro",
  gato: "Gato",
  conejo: "Conejo",
  ave: "Ave",
  roedor: "Roedor",
  reptil: "Reptil",
  otro: "Otro",
};

export const PET_SEX = ["macho", "hembra", "desconocido"] as const;

export type PetSex = (typeof PET_SEX)[number];

export const PET_SEX_LABELS: Record<PetSex, string> = {
  macho: "Macho",
  hembra: "Hembra",
  desconocido: "Sin especificar",
};

export const APPOINTMENT_STATUSES = [
  "solicitada",
  "confirmada",
  "completada",
  "cancelada",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  solicitada: "Solicitada",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada: "Cancelada",
};

export const HEALTH_RECORD_TYPES = ["vacuna", "antiparasitario"] as const;

export type HealthRecordType = (typeof HEALTH_RECORD_TYPES)[number];

export const HEALTH_RECORD_TYPE_LABELS: Record<HealthRecordType, string> = {
  vacuna: "Vacuna",
  antiparasitario: "Antiparasitario",
};

export const USER_ROLES = ["admin", "veterinario", "recepcion"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  veterinario: "Veterinario",
  recepcion: "Recepción",
};

export const PAYMENT_METHODS = [
  "efectivo",
  "debito",
  "credito",
  "transferencia",
  "otro",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  debito: "Débito",
  credito: "Crédito",
  transferencia: "Transferencia",
  otro: "Otro",
};

export function paymentStatus(
  total: number,
  paid: number
): { label: string; variant: "green" | "amber" | "red" } {
  if (paid >= total && total > 0) return { label: "Pagado", variant: "green" };
  if (paid > 0) return { label: "Parcial", variant: "amber" };
  return { label: "Pendiente", variant: "red" };
}

// 0 = lunes … 6 = domingo
export const WEEKDAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;
