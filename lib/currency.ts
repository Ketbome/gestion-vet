// Formateo de moneda centralizado y configurable en RUNTIME (no en build):
// - Servidor: lee CURRENCY_LOCALE / CURRENCY del entorno en cada arranque.
// - Cliente: lee window.__CURRENCY__, inyectado por el root layout en cada
//   request. Así un mismo build de Docker sirve para cualquier moneda.
export type CurrencyConfig = { locale: string; currency: string };

declare global {
  interface Window {
    __CURRENCY__?: CurrencyConfig;
  }
}

export function getCurrencyConfig(): CurrencyConfig {
  if (typeof window !== "undefined" && window.__CURRENCY__) {
    return window.__CURRENCY__;
  }
  return {
    locale:
      process.env.CURRENCY_LOCALE ??
      process.env.NEXT_PUBLIC_CURRENCY_LOCALE ??
      "es-CL",
    currency:
      process.env.CURRENCY ?? process.env.NEXT_PUBLIC_CURRENCY ?? "CLP",
  };
}

let formatter: Intl.NumberFormat | null = null;

export function formatCurrency(amount: number): string {
  if (!formatter) {
    const { locale, currency } = getCurrencyConfig();
    formatter = new Intl.NumberFormat(locale, { style: "currency", currency });
  }
  return formatter.format(amount);
}
