"use client";

import { useActionState, useState } from "react";
import { formatCurrency } from "@/lib/currency";
import type { ActionState } from "@/lib/actions/attentions";
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

export type ServiceOption = { id: number; name: string; price: number };

type ServiceLine = { serviceId: number; name: string; price: number; quantity: number };
type ProductLine = { productId: number; name: string; price: number; stock: number; quantity: number };

export function AttentionForm({
  services,
  products,
  action,
  defaultDate,
}: {
  services: ServiceOption[];
  products: ComboboxProduct[];
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  defaultDate: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [productLines, setProductLines] = useState<ProductLine[]>([]);

  const total =
    serviceLines.reduce((sum, l) => sum + l.price * l.quantity, 0) +
    productLines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  const itemsJson = JSON.stringify({
    services: serviceLines.map((l) => ({ serviceId: l.serviceId, quantity: l.quantity })),
    products: productLines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
  });

  function addService(serviceId: number) {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;
    setServiceLines((lines) => {
      const existing = lines.find((l) => l.serviceId === serviceId);
      if (existing) {
        return lines.map((l) =>
          l.serviceId === serviceId ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...lines,
        { serviceId, name: service.name, price: service.price, quantity: 1 },
      ];
    });
  }

  function addProduct(product: ComboboxProduct) {
    setProductLines((lines) => {
      const existing = lines.find((l) => l.productId === product.id);
      if (existing) {
        return lines.map((l) =>
          l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...lines,
        {
          productId: product.id,
          name: product.name,
          price: product.salePrice,
          stock: product.stock,
          quantity: 1,
        },
      ];
    });
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <Card className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="petName">Mascota</Label>
            <Input id="petName" name="petName" placeholder="Ej: Firulais" required />
          </div>
          <div>
            <Label htmlFor="ownerName">Dueño/a</Label>
            <Input id="ownerName" name="ownerName" placeholder="Ej: María Pérez" required />
          </div>
        </div>
        <div>
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" name="date" type="date" defaultValue={defaultDate} required />
        </div>
        <div>
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Diagnóstico, indicaciones, próximos controles…"
          />
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <h2 className="font-semibold text-gray-900">Servicios</h2>
        <Select
          value=""
          aria-label="Agregar servicio"
          onChange={(e) => {
            if (e.target.value) addService(Number(e.target.value));
          }}
        >
          <option value="">+ Agregar servicio…</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {formatCurrency(s.price)}
            </option>
          ))}
        </Select>
        <LineList
          lines={serviceLines.map((l) => ({
            key: l.serviceId,
            name: l.name,
            price: l.price,
            quantity: l.quantity,
          }))}
          onQuantity={(key, quantity) =>
            setServiceLines((lines) =>
              lines.map((l) => (l.serviceId === key ? { ...l, quantity } : l))
            )
          }
          onRemove={(key) =>
            setServiceLines((lines) => lines.filter((l) => l.serviceId !== key))
          }
        />
      </Card>

      <Card className="space-y-3 p-5">
        <h2 className="font-semibold text-gray-900">Productos vendidos</h2>
        <ProductCombobox products={products} onSelect={addProduct} />
        <LineList
          lines={productLines.map((l) => ({
            key: l.productId,
            name: l.name,
            price: l.price,
            quantity: l.quantity,
            warning:
              l.quantity > l.stock
                ? `Solo hay ${l.stock} en stock`
                : undefined,
          }))}
          onQuantity={(key, quantity) =>
            setProductLines((lines) =>
              lines.map((l) => (l.productId === key ? { ...l, quantity } : l))
            )
          }
          onRemove={(key) =>
            setProductLines((lines) => lines.filter((l) => l.productId !== key))
          }
        />
      </Card>

      <Card className="flex items-center justify-between p-5">
        <span className="font-semibold text-gray-700">Total</span>
        <span className="text-2xl font-bold text-primary-700 tabular-nums">
          {formatCurrency(total)}
        </span>
      </Card>

      <input type="hidden" name="items" value={itemsJson} />
      <FormError message={state.error} />
      <SubmitButton className="w-full sm:w-auto">Registrar atención</SubmitButton>
    </form>
  );
}

function LineList({
  lines,
  onQuantity,
  onRemove,
}: {
  lines: {
    key: number;
    name: string;
    price: number;
    quantity: number;
    warning?: string;
  }[];
  onQuantity: (key: number, quantity: number) => void;
  onRemove: (key: number) => void;
}) {
  if (lines.length === 0)
    return <p className="text-sm text-gray-400">Nada agregado todavía.</p>;

  return (
    <ul className="divide-y divide-gray-100">
      {lines.map((l) => (
        <li key={l.key} className="flex items-center gap-2 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{l.name}</p>
            <p className="text-xs text-gray-500 tabular-nums">
              {formatCurrency(l.price)} c/u
            </p>
            {l.warning && <p className="text-xs text-amber-600">{l.warning}</p>}
          </div>
          <input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={l.quantity}
            aria-label={`Cantidad de ${l.name}`}
            onChange={(e) =>
              onQuantity(l.key, Math.max(1, Math.round(Number(e.target.value) || 1)))
            }
            className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-center text-sm tabular-nums focus:border-primary-500 focus:outline-none"
          />
          <span className="w-20 text-right text-sm font-semibold text-gray-900 tabular-nums">
            {formatCurrency(l.price * l.quantity)}
          </span>
          <button
            type="button"
            onClick={() => onRemove(l.key)}
            aria-label={`Quitar ${l.name}`}
            className="rounded-lg px-2 py-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
