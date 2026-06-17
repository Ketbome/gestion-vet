"use client";

import { useActionState } from "react";
import {
  requestAppointment,
  type ActionState,
} from "@/lib/actions/public-booking";
import { SPECIES, SPECIES_LABELS } from "@/lib/constants";
import { Input, Label, Select, Textarea, FormError } from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";
import { SlotPicker, type VetOption } from "@/components/agenda/slot-picker";

export function PublicBookingForm({
  minDate,
  vets,
}: {
  minDate: string;
  vets: VetOption[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    requestAppointment,
    {}
  );

  if (state.ok) {
    return (
      <Card className="p-6 text-center">
        <h2 className="text-lg font-bold text-gray-900">¡Solicitud enviada!</h2>
        <p className="mt-2 text-sm text-gray-600">
          Recibimos tu solicitud de cita. Te contactaremos para confirmarla.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="tutorName">Tu nombre</Label>
          <Input id="tutorName" name="tutorName" placeholder="Nombre y apellido" required />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="tutorPhone">Teléfono</Label>
            <Input
              id="tutorPhone"
              name="tutorPhone"
              type="tel"
              placeholder="+56 9 1234 5678"
            />
          </div>
          <div>
            <Label htmlFor="tutorEmail">Email</Label>
            <Input
              id="tutorEmail"
              name="tutorEmail"
              type="email"
              placeholder="correo@ejemplo.com"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Déjanos al menos un teléfono o email para confirmarte la cita.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="petName">Nombre de la mascota</Label>
            <Input id="petName" name="petName" placeholder="Ej: Firulais" />
          </div>
          <div>
            <Label htmlFor="species">Especie</Label>
            <Select id="species" name="species" defaultValue="perro">
              {SPECIES.map((s) => (
                <option key={s} value={s}>
                  {SPECIES_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <SlotPicker vets={vets} defaultDate={minDate} />

        <div>
          <Label htmlFor="reason">Motivo (opcional)</Label>
          <Textarea
            id="reason"
            name="reason"
            placeholder="Ej: Vacuna, control, consulta…"
          />
        </div>

        {/* Honeypot anti-spam: oculto para humanos */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        <FormError message={state.error} />
        <SubmitButton className="w-full">Solicitar cita</SubmitButton>
      </form>
    </Card>
  );
}
