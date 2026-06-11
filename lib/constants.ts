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
