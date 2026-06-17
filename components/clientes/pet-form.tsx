"use client";

import { useActionState } from "react";
import type { Pet } from "@/lib/db/schema";
import type { ActionState } from "@/lib/actions/pets";
import {
  SPECIES,
  SPECIES_LABELS,
  PET_SEX,
  PET_SEX_LABELS,
} from "@/lib/constants";
import { Input, Label, Select, Textarea, FormError } from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";

export function PetForm({
  pet,
  tutorId,
  tutorName,
  action,
}: {
  pet?: Pet;
  tutorId: number;
  tutorName: string;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  return (
    <Card className="max-w-lg p-5">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="tutorId" value={tutorId} />
        <p className="text-sm text-gray-500">
          Tutor: <span className="font-medium text-gray-700">{tutorName}</span>
        </p>
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            defaultValue={pet?.name}
            placeholder="Ej: Firulais"
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="species">Especie</Label>
            <Select id="species" name="species" defaultValue={pet?.species ?? "perro"}>
              {SPECIES.map((s) => (
                <option key={s} value={s}>
                  {SPECIES_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="sex">Sexo</Label>
            <Select id="sex" name="sex" defaultValue={pet?.sex ?? "desconocido"}>
              {PET_SEX.map((s) => (
                <option key={s} value={s}>
                  {PET_SEX_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="breed">Raza (opcional)</Label>
            <Input
              id="breed"
              name="breed"
              defaultValue={pet?.breed ?? ""}
              placeholder="Ej: Labrador"
            />
          </div>
          <div>
            <Label htmlFor="birthDate">Fecha de nacimiento (opcional)</Label>
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              defaultValue={pet?.birthDate ?? ""}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="weightKg">Peso actual en kg (opcional)</Label>
            <Input
              id="weightKg"
              name="weightKg"
              type="number"
              min={0}
              step={0.1}
              inputMode="decimal"
              defaultValue={pet?.weightGrams ? pet.weightGrams / 1000 : ""}
              placeholder="12.5"
            />
          </div>
          <div>
            <Label htmlFor="microchip">Microchip (opcional)</Label>
            <Input
              id="microchip"
              name="microchip"
              defaultValue={pet?.microchip ?? ""}
              placeholder="Nº de microchip"
            />
          </div>
        </div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="sterilized"
            defaultChecked={pet?.sterilized ?? false}
            className="h-4 w-4"
          />
          <span className="text-sm text-gray-700">Esterilizado/a</span>
        </label>
        <div>
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={pet?.notes ?? ""}
            placeholder="Alergias, condiciones, observaciones…"
          />
        </div>
        <FormError message={state.error} />
        <SubmitButton>{pet ? "Guardar cambios" : "Crear mascota"}</SubmitButton>
      </form>
    </Card>
  );
}
