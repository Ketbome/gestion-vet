"use client";

import { useState } from "react";
import Link from "next/link";
import { Input, Label } from "@/components/ui/form-fields";
import { EntityCombobox } from "@/components/entity-combobox";

export type TutorOption = { id: number; name: string; phone: string | null };
export type PetOption = { id: number; tutorId: number; name: string; species: string };

export function PatientFields({
  tutors,
  pets,
  defaultPet,
}: {
  tutors: TutorOption[];
  pets: PetOption[];
  defaultPet?: { id: number; name: string; tutorId: number; tutorName: string };
}) {
  const [freeText, setFreeText] = useState(false);
  const [tutor, setTutor] = useState<{ id: number; name: string } | null>(
    defaultPet ? { id: defaultPet.tutorId, name: defaultPet.tutorName } : null
  );
  const [pet, setPet] = useState<{ id: number; name: string } | null>(
    defaultPet ? { id: defaultPet.id, name: defaultPet.name } : null
  );

  const petsOfTutor = tutor
    ? pets.filter((p) => p.tutorId === tutor.id)
    : [];

  if (freeText) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="petName">Mascota</Label>
            <Input id="petName" name="petName" placeholder="Ej: Firulais" required />
          </div>
          <div>
            <Label htmlFor="ownerName">Dueño/a</Label>
            <Input id="ownerName" name="ownerName" placeholder="Ej: María Pérez" required />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setFreeText(false)}
          className="text-sm font-medium text-primary-600 hover:underline"
        >
          ← Usar ficha de cliente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Tutor */}
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
        <div className="mt-1 flex items-center gap-3 text-xs">
          <Link href="/clientes/nuevo" className="text-primary-600 hover:underline">
            + Nuevo cliente
          </Link>
          <button
            type="button"
            onClick={() => setFreeText(true)}
            className="text-gray-500 hover:underline"
          >
            Registrar sin ficha
          </button>
        </div>
      </div>

      {/* Mascota */}
      {tutor && (
        <div>
          <Label>Mascota</Label>
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
            <p className="text-sm text-gray-400">Este cliente no tiene mascotas.</p>
          )}
          <Link
            href={`/mascotas/nuevo?tutor=${tutor.id}`}
            className="mt-1 inline-block text-xs text-primary-600 hover:underline"
          >
            + Nueva mascota
          </Link>
        </div>
      )}

      {/* Peso y temperatura */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="weightKg">Peso en kg (opcional)</Label>
          <Input
            id="weightKg"
            name="weightKg"
            type="number"
            min={0}
            step={0.1}
            inputMode="decimal"
            placeholder="12.5"
          />
        </div>
        <div>
          <Label htmlFor="temperature">Temperatura °C (opcional)</Label>
          <Input
            id="temperature"
            name="temperature"
            type="number"
            min={0}
            step={0.1}
            inputMode="decimal"
            placeholder="38.5"
          />
        </div>
      </div>

      {/* Snapshot para el servidor */}
      {tutor && <input type="hidden" name="tutorId" value={tutor.id} />}
      {pet && <input type="hidden" name="petId" value={pet.id} />}
      {/* En modo completo el servidor resuelve los nombres desde petId; estos
          ayudan cuando se eligió tutor sin ficha de mascota */}
      <input type="hidden" name="petName" value={pet?.name ?? ""} />
      <input type="hidden" name="ownerName" value={tutor?.name ?? ""} />
    </div>
  );
}
