"use client";

import { useActionState } from "react";
import type { Service } from "@/lib/db/schema";
import type { ActionState } from "@/lib/actions/services";
import { Input, Label, Textarea, FormError } from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";

export function ServiceForm({
  service,
  action,
}: {
  service?: Service;
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
            defaultValue={service?.name}
            placeholder="Ej: Consulta general"
            required
          />
        </div>
        <div>
          <Label htmlFor="price">Precio</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            defaultValue={service?.price}
            placeholder="15000"
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Descripción (opcional)</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={service?.description ?? ""}
            placeholder="Detalle del servicio"
          />
        </div>
        <FormError message={state.error} />
        <SubmitButton>
          {service ? "Guardar cambios" : "Crear servicio"}
        </SubmitButton>
      </form>
    </Card>
  );
}
