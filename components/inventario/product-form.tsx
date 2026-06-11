"use client";

import { useActionState } from "react";
import type { Product } from "@/lib/db/schema";
import type { ActionState } from "@/lib/actions/products";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
} from "@/lib/constants";
import { Input, Label, Select, FormError } from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";

export function ProductForm({
  product,
  action,
}: {
  product?: Product;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  return (
    <Card className="max-w-lg p-5">
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            defaultValue={product?.name}
            placeholder="Ej: Vacuna antirrábica"
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Categoría</Label>
          <Select
            id="category"
            name="category"
            defaultValue={product?.category ?? "medicamento"}
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {PRODUCT_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="stock">Stock actual</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              defaultValue={product?.stock ?? 0}
              required
            />
          </div>
          <div>
            <Label htmlFor="minStock">Stock mínimo (alerta)</Label>
            <Input
              id="minStock"
              name="minStock"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              defaultValue={product?.minStock ?? 0}
              required
            />
          </div>
          <div>
            <Label htmlFor="costPrice">Precio de costo</Label>
            <Input
              id="costPrice"
              name="costPrice"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              defaultValue={product?.costPrice ?? 0}
              required
            />
          </div>
          <div>
            <Label htmlFor="salePrice">Precio de venta</Label>
            <Input
              id="salePrice"
              name="salePrice"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              defaultValue={product?.salePrice ?? 0}
              required
            />
          </div>
        </div>
        <FormError message={state.error} />
        <SubmitButton>
          {product ? "Guardar cambios" : "Crear producto"}
        </SubmitButton>
      </form>
    </Card>
  );
}
