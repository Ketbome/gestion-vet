"use client";

import { useActionState } from "react";
import { setNextVisit, type ActionState } from "@/lib/actions/pets";
import { Input, Label, FormError } from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";

export function NextVisitForm({
  petId,
  date,
  note,
}: {
  petId: number;
  date: string | null;
  note: string | null;
}) {
  const action = setNextVisit.bind(null, petId);
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <Label htmlFor="nextVisitDate">Fecha</Label>
        <Input
          id="nextVisitDate"
          name="nextVisitDate"
          type="date"
          defaultValue={date ?? ""}
          className="w-44"
        />
      </div>
      <div className="min-w-40 flex-1">
        <Label htmlFor="nextVisitNote">Motivo</Label>
        <Input
          id="nextVisitNote"
          name="nextVisitNote"
          defaultValue={note ?? ""}
          placeholder="Ej: control anual"
        />
      </div>
      <SubmitButton>Guardar</SubmitButton>
      <p className="w-full text-xs text-gray-400">
        Deja la fecha vacía y guarda para quitar el recordatorio.
      </p>
      <div className="w-full">
        <FormError message={state.error} />
      </div>
    </form>
  );
}
