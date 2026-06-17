"use client";

import { useActionState, useState } from "react";
import {
  createPrescription,
  type ActionState,
} from "@/lib/actions/prescriptions";
import { Input, Label, Select, Textarea, FormError } from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";
import { MedicationInput } from "@/components/recetas/medication-input";

type Item = {
  medication: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
};

type VetOption = { id: number; name: string };

const empty: Item = {
  medication: "",
  dose: "",
  frequency: "",
  duration: "",
  instructions: "",
};

export function PrescriptionForm({
  petId,
  attentionId,
  vets,
  medications,
  defaultVetId,
  defaultDate,
}: {
  petId: number;
  attentionId?: number;
  vets: VetOption[];
  medications: string[];
  defaultVetId?: number;
  defaultDate: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createPrescription,
    {}
  );
  const [items, setItems] = useState<Item[]>([{ ...empty }]);

  function update(i: number, field: keyof Item, value: string) {
    setItems((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it))
    );
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <input type="hidden" name="petId" value={petId} />
      {attentionId && <input type="hidden" name="attentionId" value={attentionId} />}
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <Card className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="vetId">Veterinario que firma</Label>
            <Select id="vetId" name="vetId" defaultValue={defaultVetId ?? ""}>
              <option value="">Sin asignar</option>
              {vets.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="date">Fecha</Label>
            <Input id="date" name="date" type="date" defaultValue={defaultDate} required />
          </div>
        </div>

        {items.map((it, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Medicamento {i + 1}
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-600 hover:underline"
                >
                  Quitar
                </button>
              )}
            </div>
            <MedicationInput
              value={it.medication}
              onChange={(v) => update(i, "medication", v)}
              suggestions={medications}
              placeholder="Medicamento (elige del catálogo o escribe uno nuevo)"
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Input
                placeholder="Dosis (1 comp.)"
                value={it.dose}
                onChange={(e) => update(i, "dose", e.target.value)}
              />
              <Input
                placeholder="Frecuencia (c/12h)"
                value={it.frequency}
                onChange={(e) => update(i, "frequency", e.target.value)}
              />
              <Input
                placeholder="Duración (7 días)"
                value={it.duration}
                onChange={(e) => update(i, "duration", e.target.value)}
              />
            </div>
            <Input
              placeholder="Indicaciones (con comida…)"
              value={it.instructions}
              onChange={(e) => update(i, "instructions", e.target.value)}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() => setItems((p) => [...p, { ...empty }])}
          className="text-sm font-semibold text-primary-600 hover:underline"
        >
          + Agregar medicamento
        </button>

        <div>
          <Label htmlFor="notes">Indicaciones generales (opcional)</Label>
          <Textarea id="notes" name="notes" placeholder="Reposo, control en 7 días…" />
        </div>
      </Card>

      <FormError message={state.error} />
      <SubmitButton>Emitir receta</SubmitButton>
    </form>
  );
}
