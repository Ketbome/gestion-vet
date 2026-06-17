"use client";

import { useActionState } from "react";
import type { Tutor } from "@/lib/db/schema";
import type { ActionState } from "@/lib/actions/tutors";
import { Input, Label, Textarea, FormError } from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";

export function TutorForm({
  tutor,
  action,
}: {
  tutor?: Tutor;
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
            defaultValue={tutor?.name}
            placeholder="Ej: María Pérez"
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={tutor?.phone ?? ""}
              placeholder="+56 9 1234 5678"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={tutor?.email ?? ""}
              placeholder="correo@ejemplo.com"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Ingresa al menos un teléfono o email.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="rut">RUT (opcional)</Label>
            <Input
              id="rut"
              name="rut"
              defaultValue={tutor?.rut ?? ""}
              placeholder="12.345.678-9"
            />
          </div>
          <div>
            <Label htmlFor="address">Dirección (opcional)</Label>
            <Input
              id="address"
              name="address"
              defaultValue={tutor?.address ?? ""}
              placeholder="Calle 123"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Textarea id="notes" name="notes" defaultValue={tutor?.notes ?? ""} />
        </div>
        <FormError message={state.error} />
        <SubmitButton>{tutor ? "Guardar cambios" : "Crear cliente"}</SubmitButton>
      </form>
    </Card>
  );
}
