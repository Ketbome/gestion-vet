"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { ActionState } from "@/lib/actions/hospitalizations";
import { Input, Label, Select, Textarea, FormError } from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";
import { EntityCombobox } from "@/components/entity-combobox";

export type PetOption = { id: number; name: string; tutorName: string };

export function HospitalizationForm({
  pets,
  vets,
  defaultDate,
  defaultPet,
  defaultVetId,
  action,
}: {
  pets: PetOption[];
  vets: { id: number; name: string }[];
  defaultDate: string;
  defaultPet?: { id: number; name: string };
  defaultVetId?: number;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  const [pet, setPet] = useState<{ id: number; name: string } | null>(
    defaultPet ?? null
  );

  return (
    <Card className="max-w-lg p-5">
      <form action={formAction} className="space-y-4">
        <div>
          <Label>Mascota</Label>
          {pet ? (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <span className="font-medium text-gray-900">{pet.name}</span>
              <button
                type="button"
                onClick={() => setPet(null)}
                className="text-xs font-medium text-primary-600 hover:underline"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <EntityCombobox
              items={pets.map((p) => ({
                id: p.id,
                label: p.name,
                sublabel: p.tutorName,
              }))}
              placeholder="Buscar mascota…"
              onSelect={(item) => setPet({ id: item.id, name: item.label })}
            />
          )}
          {pet && <input type="hidden" name="petId" value={pet.id} />}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="admittedAt">Fecha de ingreso</Label>
            <Input id="admittedAt" name="admittedAt" type="date" defaultValue={defaultDate} />
          </div>
          <div>
            <Label htmlFor="vetId">Veterinario (opcional)</Label>
            <Select id="vetId" name="vetId" defaultValue={defaultVetId ?? ""}>
              <option value="">Sin asignar</option>
              {vets.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="reason">Motivo de ingreso</Label>
          <Textarea
            id="reason"
            name="reason"
            placeholder="Ej: Postoperatorio, deshidratación, observación…"
          />
        </div>
        <div>
          <Label htmlFor="diagnosis">Diagnóstico (opcional)</Label>
          <Textarea id="diagnosis" name="diagnosis" />
        </div>
        <div>
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Textarea id="notes" name="notes" />
        </div>

        <FormError message={state.error} />
        <div className="flex items-center gap-3">
          <SubmitButton>Hospitalizar</SubmitButton>
          <Link
            href="/hospitalizaciones"
            className="text-sm font-medium text-gray-500 hover:underline"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </Card>
  );
}
