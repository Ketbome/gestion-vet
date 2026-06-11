"use client";

import { useActionState, useState } from "react";
import { formatCurrency } from "@/lib/currency";
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

  const totalCost = lines.reduce((sum, l) => sum + l.unitCost * l.quantity, 0);

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
              <li key={l.key} className="flex items-center gap-2 py-2">
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                  {l.name}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>Cant.</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={l.quantity}
                    aria-label={`Cantidad de ${l.name}`}
                    onChange={(e) =>
                      updateLine(l.key, {
                        quantity: Math.max(1, Math.round(Number(e.target.value) || 1)),
                      })
                    }
                    className="w-14 rounded-lg border border-gray-300 px-1.5 py-1.5 text-center text-sm tabular-nums focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>Costo</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={l.unitCost}
                    aria-label={`Costo unitario de ${l.name}`}
                    onChange={(e) =>
                      updateLine(l.key, {
                        unitCost: Math.max(0, Math.round(Number(e.target.value) || 0)),
                      })
                    }
                    className="w-20 rounded-lg border border-gray-300 px-1.5 py-1.5 text-right text-sm tabular-nums focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <span className="w-20 text-right text-sm font-semibold text-gray-900 tabular-nums">
                  {formatCurrency(l.unitCost * l.quantity)}
                </span>
                <button
                  type="button"
                  onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                  aria-label={`Quitar ${l.name}`}
                  className="rounded-lg px-2 py-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex items-center justify-between p-5">
        <span className="font-semibold text-gray-700">Costo total</span>
        <span className="text-2xl font-bold text-gray-900 tabular-nums">
          {formatCurrency(totalCost)}
        </span>
      </Card>

      <input type="hidden" name="items" value={itemsJson} />
      <FormError message={state.error} />
      <SubmitButton className="w-full sm:w-auto">Crear pedido</SubmitButton>
    </form>
  );
}
