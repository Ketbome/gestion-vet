"use client";

import { useActionState, useState } from "react";
import {
  addHospitalizationCharge,
  type ActionState,
} from "@/lib/actions/hospitalizations";
import { formatCurrency } from "@/lib/currency";
import { Input, Label, FormError } from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { ProductCombobox, type ComboboxProduct } from "@/components/product-combobox";

export function ChargeForm({
  hospitalizationId,
  products,
}: {
  hospitalizationId: number;
  products: ComboboxProduct[];
}) {
  const action = addHospitalizationCharge.bind(null, hospitalizationId);
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  const [mode, setMode] = useState<"producto" | "manual">("producto");
  const [product, setProduct] = useState<ComboboxProduct | null>(null);

  return (
    <form action={formAction} className="space-y-3 border-t border-gray-100 pt-3">
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setMode("producto")}
          className={`rounded-lg px-3 py-1.5 font-medium ${
            mode === "producto" ? "bg-primary-50 text-primary-700" : "text-gray-500"
          }`}
        >
          Producto / insumo
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`rounded-lg px-3 py-1.5 font-medium ${
            mode === "manual" ? "bg-primary-50 text-primary-700" : "text-gray-500"
          }`}
        >
          Cargo manual
        </button>
      </div>

      {mode === "producto" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <Label>Producto</Label>
            {product ? (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <span className="font-medium text-gray-900">{product.name}</span>
                <button
                  type="button"
                  onClick={() => setProduct(null)}
                  className="text-xs font-medium text-primary-600 hover:underline"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <ProductCombobox products={products} onSelect={setProduct} />
            )}
            {product && <input type="hidden" name="productId" value={product.id} />}
          </div>
          <div>
            <Label htmlFor="quantity">Cantidad</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              step={1}
              defaultValue={1}
              className="w-24"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              name="description"
              placeholder="Ej: Día de hospitalización"
            />
          </div>
          <div>
            <Label htmlFor="unitPrice">Valor</Label>
            <Input
              id="unitPrice"
              name="unitPrice"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              className="w-32"
            />
          </div>
          <div>
            <Label htmlFor="quantity">Cantidad</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              step={1}
              defaultValue={1}
              className="w-24"
            />
          </div>
        </div>
      )}

      {mode === "producto" && product && (
        <p className="text-xs text-gray-500">
          Precio unitario: {formatCurrency(product.salePrice)} · descuenta stock
        </p>
      )}

      <FormError message={state.error} />
      <SubmitButton>Agregar cargo</SubmitButton>
    </form>
  );
}
