"use client";

import { formatCurrency } from "@/lib/currency";
import { computeDiscount, type DiscountType } from "@/lib/discount";
import { NumberField } from "./number-field";

// Descuento con toggle $/% al estilo GestionVet. Emite los campos ocultos
// discountType/discountValue para que la server action lo recalcule.
export function DiscountField({
  subtotal,
  type,
  value,
  onTypeChange,
  onValueChange,
}: {
  subtotal: number;
  type: DiscountType;
  value: number;
  onTypeChange: (type: DiscountType) => void;
  onValueChange: (value: number) => void;
}) {
  const amount = computeDiscount(subtotal, type, value);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Descuento</span>
      <div className="flex rounded-lg border border-gray-300 bg-white p-0.5">
        {(["amount", "percent"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTypeChange(t)}
            aria-pressed={type === t}
            className={`rounded-md px-2.5 py-1 text-sm font-semibold transition ${
              type === t
                ? "bg-primary-600 text-white"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {t === "amount" ? "$" : "%"}
          </button>
        ))}
      </div>
      <NumberField
        value={value}
        min={0}
        max={type === "percent" ? 100 : undefined}
        onValue={onValueChange}
        aria-label={type === "percent" ? "Descuento en porcentaje" : "Descuento en pesos"}
        className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-right text-sm tabular-nums focus:border-primary-500 focus:outline-none"
      />
      {amount > 0 && (
        <span className="ml-auto text-sm font-semibold text-red-600 tabular-nums">
          −{formatCurrency(amount)}
        </span>
      )}
      <input type="hidden" name="discountType" value={type} />
      <input type="hidden" name="discountValue" value={value} />
    </div>
  );
}
