"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createAppointment,
  type ActionState,
} from "@/lib/actions/appointments";
import { Input, Label, Textarea, FormError } from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";
import { EntityCombobox } from "@/components/entity-combobox";
import { SlotPicker, type VetOption } from "@/components/agenda/slot-picker";

type TutorOption = { id: number; name: string; phone: string | null };
type PetOption = { id: number; tutorId: number; name: string };

export function AppointmentForm({
  tutors,
  pets,
  vets,
  defaultDate,
  defaultVetId,
}: {
  tutors: TutorOption[];
  pets: PetOption[];
  vets: VetOption[];
  defaultDate: string;
  defaultVetId?: number;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createAppointment,
    {}
  );
  const [tutor, setTutor] = useState<{ id: number; name: string } | null>(null);
  const [pet, setPet] = useState<{ id: number; name: string } | null>(null);

  const petsOfTutor = tutor ? pets.filter((p) => p.tutorId === tutor.id) : [];

  return (
    <Card className="max-w-lg p-5">
      <form action={formAction} className="space-y-4">
        <div>
          <Label>Cliente (tutor)</Label>
          {tutor ? (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <span className="font-medium text-gray-900">{tutor.name}</span>
              <button
                type="button"
                onClick={() => {
                  setTutor(null);
                  setPet(null);
                }}
                className="text-xs font-medium text-primary-600 hover:underline"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <EntityCombobox
              items={tutors.map((t) => ({
                id: t.id,
                label: t.name,
                sublabel: t.phone ?? undefined,
              }))}
              placeholder="Buscar cliente…"
              onSelect={(item) => {
                setTutor({ id: item.id, name: item.label });
                setPet(null);
              }}
            />
          )}
          <Link
            href="/clientes/nuevo"
            className="mt-1 inline-block text-xs text-primary-600 hover:underline"
          >
            + Nuevo cliente
          </Link>
        </div>

        {tutor && (
          <div>
            <Label>Mascota (opcional)</Label>
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
            ) : petsOfTutor.length > 0 ? (
              <EntityCombobox
                items={petsOfTutor.map((p) => ({ id: p.id, label: p.name }))}
                placeholder="Buscar mascota…"
                onSelect={(item) => setPet({ id: item.id, name: item.label })}
              />
            ) : (
              <p className="text-sm text-gray-400">Sin mascotas registradas.</p>
            )}
          </div>
        )}

        <SlotPicker vets={vets} defaultDate={defaultDate} defaultVetId={defaultVetId} />

        <div>
          <Label htmlFor="reason">Motivo (opcional)</Label>
          <Input id="reason" name="reason" placeholder="Ej: Control, vacuna…" />
        </div>
        <div>
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Textarea id="notes" name="notes" />
        </div>

        {tutor && <input type="hidden" name="tutorId" value={tutor.id} />}
        {pet && <input type="hidden" name="petId" value={pet.id} />}
        <FormError message={state.error} />
        <SubmitButton>Agendar cita</SubmitButton>
      </form>
    </Card>
  );
}
