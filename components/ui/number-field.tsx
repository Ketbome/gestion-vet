"use client";

import { useState } from "react";

// Input numérico controlado "a medias": conserva el texto tal cual mientras se
// escribe (permite borrar todo sin que el mínimo reaparezca al instante) y
// recién al salir del campo vuelve a mostrar el valor normalizado.
export function NumberField({
  value,
  min = 0,
  onValue,
  ...rest
}: {
  value: number;
  min?: number;
  onValue: (value: number) => void;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "min" | "onChange" | "type"
>) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <input
      type="number"
      min={min}
      step={1}
      inputMode="numeric"
      value={draft ?? value}
      onChange={(e) => {
        setDraft(e.target.value);
        const parsed = Math.round(Number(e.target.value));
        if (e.target.value !== "" && Number.isFinite(parsed)) {
          onValue(Math.max(min, parsed));
        }
      }}
      onBlur={() => setDraft(null)}
      {...rest}
    />
  );
}
