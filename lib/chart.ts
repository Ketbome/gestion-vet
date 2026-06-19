import { getCurrencyConfig } from "./currency";

// Paleta alineada al teal/ámbar de la app, con tonos extra para tortas.
export const CHART = {
  income: "#0d9488",
  expenses: "#f43f5e",
  profit: "#f59e0b",
  primary: "#0d9488",
};

export const PIE_COLORS = [
  "#0d9488",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#64748b",
];

// Formato compacto para ejes: $15k, $1,2M (evita ticks larguísimos).
export function compactCurrency(value: number): string {
  const { locale, currency } = getCurrencyConfig();
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
