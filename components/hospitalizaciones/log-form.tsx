"use client";

import { useActionState } from "react";
import { addHospitalizationLog, type ActionState } from "@/lib/actions/hospitalizations";
import { Input, Label, Textarea, FormError } from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";

export function LogForm({
  hospitalizationId,
  today,
}: {
  hospitalizationId: number;
  today: string;
}) {
  const action = addHospitalizationLog.bind(null, hospitalizationId);
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-3 border-t border-gray-100 pt-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" name="date" type="date" defaultValue={today} />
        </div>
        <div>
          <Label htmlFor="weightKg">Peso (kg)</Label>
          <Input
            id="weightKg"
            name="weightKg"
            type="number"
            min={0}
            step={0.1}
            inputMode="decimal"
            placeholder="12.5"
          />
        </div>
        <div>
          <Label htmlFor="temperature">Temp °C</Label>
          <Input
            id="temperature"
            name="temperature"
            type="number"
            min={0}
            step={0.1}
            inputMode="decimal"
            placeholder="38.5"
          />
        </div>
        <div>
          <Label htmlFor="heartRate">FC (lpm)</Label>
          <Input
            id="heartRate"
            name="heartRate"
            type="number"
            min={0}
            inputMode="numeric"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="treatment">Tratamiento / procedimientos del día</Label>
        <Textarea id="treatment" name="treatment" />
      </div>
      <div>
        <Label htmlFor="notes">Observaciones</Label>
        <Textarea id="notes" name="notes" />
      </div>
      <FormError message={state.error} />
      <SubmitButton>Agregar evolución</SubmitButton>
    </form>
  );
}
