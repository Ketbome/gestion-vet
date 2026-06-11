"use client";

import { useActionState } from "react";
import type { Expense } from "@/lib/db/schema";
import type { ActionState } from "@/lib/actions/expenses";
import {
  MANUAL_EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
} from "@/lib/constants";
import { Input, Label, Select, FormError } from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";

export function ExpenseForm({
  expense,
  action,
  defaultDate,
}: {
  expense?: Expense;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  defaultDate: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  return (
    <Card className="max-w-lg p-5">
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="description">Descripción</Label>
          <Input
            id="description"
            name="description"
            defaultValue={expense?.description}
            placeholder="Ej: Arriendo del local"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select
              id="category"
              name="category"
              defaultValue={expense?.category ?? "otro"}
            >
              {MANUAL_EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {EXPENSE_CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              defaultValue={expense?.amount}
              placeholder="50000"
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="date">Fecha</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={expense?.date ?? defaultDate}
            required
          />
        </div>
        <FormError message={state.error} />
        <SubmitButton>
          {expense ? "Guardar cambios" : "Registrar gasto"}
        </SubmitButton>
      </form>
    </Card>
  );
}
