"use client";

import { useActionState, useState } from "react";
import { addBlock, type ActionState } from "@/lib/actions/schedules";
import { Label, FormError } from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";

const timeClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none";

export function BlockForm({
  userId,
  defaultDate = "",
}: {
  userId: number;
  defaultDate?: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(addBlock, {});
  const [allDay, setAllDay] = useState(false);

  return (
    <form
      key={state.error ? "err" : "ok"}
      action={formAction}
      className="space-y-3"
    >
      <input type="hidden" name="userId" value={userId} />
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="blockDate">Fecha</Label>
          <input
            id="blockDate"
            name="date"
            type="date"
            defaultValue={defaultDate}
            className={`${timeClass} w-44`}
          />
        </div>
        {!allDay && (
          <>
            <div>
              <Label htmlFor="blockStart">Desde</Label>
              <input id="blockStart" name="startTime" type="time" defaultValue="09:00" className={`${timeClass} w-32`} />
            </div>
            <div>
              <Label htmlFor="blockEnd">Hasta</Label>
              <input id="blockEnd" name="endTime" type="time" defaultValue="13:00" className={`${timeClass} w-32`} />
            </div>
          </>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          name="allDay"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
          className="h-4 w-4"
        />
        Bloquear el día completo
      </label>
      <input
        name="reason"
        placeholder="Motivo (opcional)"
        className={timeClass}
      />
      <FormError message={state.error} />
      <SubmitButton>Bloquear</SubmitButton>
    </form>
  );
}
