"use client";

import { useActionState } from "react";
import { addSchedule, type ActionState } from "@/lib/actions/schedules";
import { WEEKDAYS } from "@/lib/constants";
import { Label, Select, FormError } from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";

export function ScheduleForm({ userId }: { userId: number }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    addSchedule,
    {}
  );

  return (
    <form
      key={state.error ? "err" : "ok"}
      action={formAction}
      className="flex flex-wrap items-end gap-3"
    >
      <input type="hidden" name="userId" value={userId} />
      <div>
        <Label htmlFor="weekday">Día</Label>
        <Select id="weekday" name="weekday" defaultValue="0">
          {WEEKDAYS.map((d, i) => (
            <option key={i} value={i}>
              {d}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="startTime">Desde</Label>
        <input
          id="startTime"
          name="startTime"
          type="time"
          defaultValue="09:00"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
        />
      </div>
      <div>
        <Label htmlFor="endTime">Hasta</Label>
        <input
          id="endTime"
          name="endTime"
          type="time"
          defaultValue="13:00"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
        />
      </div>
      <SubmitButton>Agregar</SubmitButton>
      <div className="w-full">
        <FormError message={state.error} />
      </div>
    </form>
  );
}
