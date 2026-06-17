"use client";

import { useEffect, useState } from "react";
import { getFreeSlots } from "@/lib/actions/availability";
import { Label, Select } from "@/components/ui/form-fields";

export type VetOption = { id: number; name: string };

export function SlotPicker({
  vets,
  defaultDate,
  defaultVetId,
}: {
  vets: VetOption[];
  defaultDate: string;
  defaultVetId?: number;
}) {
  const [vetId, setVetId] = useState<number | "">(defaultVetId ?? "");
  const [date, setDate] = useState(defaultDate);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [time, setTime] = useState("");

  useEffect(() => {
    if (!vetId || !date) return;
    let active = true;
    getFreeSlots(Number(vetId), date).then((s) => {
      if (active) setSlots(s);
    });
    return () => {
      active = false;
    };
  }, [vetId, date]);

  const hasSlots = !!vetId && !!date && slots !== null && slots.length > 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="vetId">Veterinario</Label>
          <Select
            id="vetId"
            name="vetId"
            value={vetId}
            onChange={(e) => {
              setVetId(e.target.value ? Number(e.target.value) : "");
              setTime("");
            }}
          >
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
          <input
            id="date"
            name="date"
            type="date"
            value={date}
            min={defaultDate}
            onChange={(e) => {
              setDate(e.target.value);
              setTime("");
            }}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
          />
        </div>
      </div>

      {hasSlots ? (
        <div>
          <Label>Cupos disponibles</Label>
          <div className="flex flex-wrap gap-2">
            {slots!.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTime(s)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  time === s
                    ? "border-primary-500 bg-primary-600 text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <input type="hidden" name="time" value={time} />
        </div>
      ) : (
        <div>
          <Label htmlFor="timeManual">Hora (opcional)</Label>
          <input
            id="timeManual"
            name="time"
            type="time"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
          />
          {vetId && slots !== null && (
            <p className="mt-1 text-xs text-gray-400">
              Este veterinario no tiene horario configurado para ese día; indica la hora manualmente.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
