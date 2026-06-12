"use client";

import { useActionState, useState } from "react";
import { formatCurrency } from "@/lib/currency";
import { computeDiscount, type DiscountType } from "@/lib/discount";
import type { ActionState } from "@/lib/actions/orders";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
} from "@/lib/constants";
import {
  Input,
  Label,
  Select,
  Textarea,
  FormError,
} from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";
import { NumberField } from "@/components/ui/number-field";
import { DiscountField } from "@/components/ui/discount-field";
import {
  ProductCombobox,
  type ComboboxProduct,
} from "@/components/product-combobox";

type OrderLine = {
  key: string;
  productId?: number;
  newProduct?: { name: string; category: string; salePrice: number };
  name: string;
  quantity: number;
  unitCost: number;
};

export function OrderForm({
  products,
  action,
}: {
  products: ComboboxProduct[];
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("medicamento");
  const [newCost, setNewCost] = useState("");
  const [newSalePrice, setNewSalePrice] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("amount");
  const [discountValue, setDiscountValue] = useState(0);

  const subtotal = lines.reduce((sum, l) => sum + l.unitCost * l.quantity, 0);
  const discount = computeDiscount(subtotal, discountType, discountValue);
  const totalCost = subtotal - discount;

  const itemsJson = JSON.stringify(
    lines.map((l) =>
      l.productId != null
        ? { productId: l.productId, quantity: l.quantity, unitCost: l.unitCost }
        : { newProduct: l.newProduct!, quantity: l.quantity, unitCost: l.unitCost }
    )
  );

  function addExisting(product: ComboboxProduct) {
    setLines((prev) => {
      if (prev.some((l) => l.productId === product.id)) return prev;
      return [
        ...prev,
        {
          key: `p-${product.id}`,
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitCost: product.costPrice,
        },
      ];
    });
  }

  function addNewProduct() {
    const name = newName.trim();
    const cost = Math.round(Number(newCost));
    const sale = Math.round(Number(newSalePrice) || 0);
    if (!name || !Number.isFinite(cost) || cost < 0) return;
    setLines((prev) => [
      ...prev,
      {
        key: `n-${Date.now()}`,
        newProduct: { name, category: newCategory, salePrice: sale },
        name: `${name} (nuevo)`,
        quantity: 1,
        unitCost: cost,
      },
    ]);
    setNewName("");
    setNewCost("");
    setNewSalePrice("");
    setShowNewProduct(false);
  }

  function updateLine(key: string, patch: Partial<OrderLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <Card className="space-y-4 p-5">
        <div>
          <Label htmlFor="supplier">Proveedor</Label>
          <Input
            id="supplier"
            name="supplier"
            placeholder="Ej: Distribuidora VetSur"
            required
          />
        </div>
        <div>
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Textarea id="notes" name="notes" placeholder="Detalles del pedido…" />
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <h2 className="font-semibold text-gray-900">Productos del pedido</h2>
        <ProductCombobox
          products={products}
          onSelect={addExisting}
          placeholder="Buscar producto del catálogo…"
          priceField="costPrice"
        />

        {!showNewProduct ? (
          <button
            type="button"
            onClick={() => setShowNewProduct(true)}
            className="text-sm font-medium text-primary-600 hover:underline"
          >
            + El producto no está en el catálogo, crearlo
          </button>
        ) : (
          <div className="space-y-3 rounded-lg border border-dashed border-primary-300 bg-primary-50/50 p-3">
            <p className="text-sm font-medium text-gray-700">Producto nuevo</p>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del producto"
            />
            <div className="grid grid-cols-3 gap-2">
              <Select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                aria-label="Categoría"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {PRODUCT_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                placeholder="Costo unit."
                aria-label="Costo unitario"
              />
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={newSalePrice}
                onChange={(e) => setNewSalePrice(e.target.value)}
                placeholder="Precio venta"
                aria-label="Precio de venta"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addNewProduct}
                className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Agregar al pedido
              </button>
              <button
                type="button"
                onClick={() => setShowNewProduct(false)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {lines.length === 0 ? (
          <p className="text-sm text-gray-400">Nada agregado todavía.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {lines.map((l) => (
              <li key={l.key} className="space-y-2 py-2.5">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 text-sm font-medium text-gray-900">
                    {l.name}
                  </p>
                  <span className="shrink-0 text-sm font-semibold text-gray-900 tabular-nums">
                    {formatCurrency(l.unitCost * l.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setLines((prev) => prev.filter((x) => x.key !== l.key))
                    }
                    aria-label={`Quitar ${l.name}`}
                    className="shrink-0 rounded-lg px-2 py-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <label className="flex items-center gap-1.5 text-xs text-gray-500">
                    Cant.
                    <NumberField
                      min={1}
                      value={l.quantity}
                      aria-label={`Cantidad de ${l.name}`}
                      onValue={(quantity) => updateLine(l.key, { quantity })}
                      className="w-16 rounded-lg border border-gray-300 px-1.5 py-1.5 text-center text-sm tabular-nums focus:border-primary-500 focus:outline-none"
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500">
                    Costo
                    <NumberField
                      min={0}
                      value={l.unitCost}
                      aria-label={`Costo unitario de ${l.name}`}
                      onValue={(unitCost) => updateLine(l.key, { unitCost })}
                      className="w-24 rounded-lg border border-gray-300 px-1.5 py-1.5 text-right text-sm tabular-nums focus:border-primary-500 focus:outline-none"
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-3 p-5">
        <DiscountField
          subtotal={subtotal}
          type={discountType}
          value={discountValue}
          onTypeChange={setDiscountType}
          onValueChange={setDiscountValue}
        />
        {discount > 0 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="font-semibold text-gray-700">Costo total</span>
          <span className="text-2xl font-bold text-gray-900 tabular-nums">
            {formatCurrency(totalCost)}
          </span>
        </div>
      </Card>

      <input type="hidden" name="items" value={itemsJson} />
      <FormError message={state.error} />
      <SubmitButton className="w-full sm:w-auto">Crear pedido</SubmitButton>
    </form>
  );
}
