export type DiscountType = "amount" | "percent";

export function parseDiscountType(value: unknown): DiscountType {
  return value === "percent" ? "percent" : "amount";
}

// Descuento final en pesos, acotado entre 0 y el subtotal.
export function computeDiscount(
  subtotal: number,
  type: DiscountType,
  value: number
): number {
  if (!Number.isFinite(value) || value <= 0 || subtotal <= 0) return 0;
  const amount =
    type === "percent"
      ? Math.round((subtotal * Math.min(value, 100)) / 100)
      : Math.round(value);
  return Math.max(0, Math.min(amount, subtotal));
}
