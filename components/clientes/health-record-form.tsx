"use client";

import { useActionState, useState } from "react";
import {
  createHealthRecord,
  type ActionState,
} from "@/lib/actions/health";
import {
  HEALTH_RECORD_TYPES,
  HEALTH_RECORD_TYPE_LABELS,
} from "@/lib/constants";
import { Input, Label, Select, FormError } from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";

export function HealthRecordForm({
  petId,
  today,
}: {
  petId: number;
  today: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(
    createHealthRecord,
    {}
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-primary-600 hover:underline"
      >
        + Agregar vacuna o antiparasitario
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-gray-200 p-4">
      <input type="hidden" name="petId" value={petId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="type">Tipo</Label>
          <Select id="type" name="type" defaultValue="vacuna">
            {HEALTH_RECORD_TYPES.map((t) => (
              <option key={t} value={t}>
                {HEALTH_RECORD_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" placeholder="Ej: Óctuple / NexGard" required />
        </div>
        <div>
          <Label htmlFor="appliedDate">Fecha de aplicación</Label>
          <Input id="appliedDate" name="appliedDate" type="date" defaultValue={today} required />
        </div>
        <div>
          <Label htmlFor="nextDueDate">Próxima dosis (opcional)</Label>
          <Input id="nextDueDate" name="nextDueDate" type="date" />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Input id="notes" name="notes" placeholder="Lote, observaciones…" />
      </div>
      <FormError message={state.error} />
      <div className="flex items-center gap-2">
        <SubmitButton>Guardar</SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
