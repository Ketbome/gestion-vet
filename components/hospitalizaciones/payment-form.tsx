"use client";

import { useActionState } from "react";
import {
  addHospitalizationPayment,
  type ActionState,
} from "@/lib/actions/hospitalizations";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { Input, Label, Select, FormError } from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";

export function HospitalizationPaymentForm({
  hospitalizationId,
  remaining,
  today,
}: {
  hospitalizationId: number;
  remaining: number;
  today: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    addHospitalizationPayment,
    {}
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="hospitalizationId" value={hospitalizationId} />
      <div>
        <Label htmlFor="amount">Monto</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          defaultValue={remaining > 0 ? remaining : ""}
          className="w-32"
        />
      </div>
      <div>
        <Label htmlFor="method">Medio</Label>
        <Select id="method" name="method" defaultValue="efectivo">
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {PAYMENT_METHOD_LABELS[m]}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="date">Fecha</Label>
        <Input id="date" name="date" type="date" defaultValue={today} className="w-40" />
      </div>
      <SubmitButton>Registrar pago</SubmitButton>
      <div className="w-full">
        <FormError message={state.error} />
      </div>
    </form>
  );
}
