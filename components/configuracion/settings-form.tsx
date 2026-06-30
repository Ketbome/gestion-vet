"use client";

import { useActionState, useState } from "react";
import type { Settings } from "@/lib/db/schema";
import { updateSettings, type ActionState } from "@/lib/actions/settings";
import { CLINIC_MODES, CLINIC_MODE_LABELS } from "@/lib/constants";
import { Input, Label, Textarea, FormError } from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";

export function SettingsForm({
  settings,
  currency,
}: {
  settings: Settings;
  currency: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateSettings,
    {}
  );
  const [mode, setMode] = useState(settings.clinicMode);
  const [ivaEnabled, setIvaEnabled] = useState(settings.ivaEnabled);
  const [preview, setPreview] = useState<string | null>(settings.logo);
  const [logoField, setLogoField] = useState("");

  function onLogo(file: File | undefined) {
    if (!file) return;
    if (file.size > 500_000) {
      alert("El logo no debe superar los 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setPreview(url);
      setLogoField(url);
    };
    reader.readAsDataURL(file);
  }

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <Card className="space-y-3 p-5">
        <h2 className="font-semibold text-gray-900">Modo de operación</h2>
        <div className="space-y-2">
          {CLINIC_MODES.map((m) => (
            <label
              key={m}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                mode === m
                  ? "border-primary-300 bg-primary-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="clinicMode"
                value={m}
                checked={mode === m}
                onChange={() => setMode(m)}
                className="mt-1"
              />
              <span>
                <span className="block font-medium text-gray-900">
                  {CLINIC_MODE_LABELS[m]}
                </span>
                <span className="block text-sm text-gray-500">
                  {m === "basico"
                    ? "Atención rápida con nombre de mascota y dueño (domicilio)."
                    : "Fichas de tutores y mascotas, historial clínico, agenda y recordatorios."}
                </span>
              </span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div>
          <Label htmlFor="clinicName">Nombre de la veterinaria</Label>
          <Input
            id="clinicName"
            name="clinicName"
            defaultValue={settings.clinicName}
            placeholder="Ej: Vet Domicilio"
          />
        </div>

        {mode === "completo" && (
          <>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="publicBookingEnabled"
                defaultChecked={settings.publicBookingEnabled}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-700">
                Habilitar agendamiento público (página{" "}
                <code className="rounded bg-gray-100 px-1">/agendar</code>)
              </span>
            </label>
            <div>
              <Label htmlFor="bookingHoursNote">
                Nota de horarios (opcional, se muestra al cliente)
              </Label>
              <Textarea
                id="bookingHoursNote"
                name="bookingHoursNote"
                defaultValue={settings.bookingHoursNote ?? ""}
                placeholder="Ej: Atendemos de lunes a viernes de 9:00 a 19:00"
              />
            </div>
            <div>
              <Label htmlFor="slotMinutes">Duración de cada cupo (minutos)</Label>
              <Input
                id="slotMinutes"
                name="slotMinutes"
                type="number"
                min={5}
                step={5}
                defaultValue={settings.slotMinutes}
                className="w-32"
              />
            </div>
          </>
        )}

        <p className="text-xs text-gray-400">
          Moneda: {currency} (configurada por variable de entorno)
        </p>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold text-gray-900">Impuestos (IVA)</h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="ivaEnabled"
            checked={ivaEnabled}
            onChange={(e) => setIvaEnabled(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm text-gray-700">
            Los precios incluyen IVA (mostrar ingresos netos en reportes)
          </span>
        </label>
        {ivaEnabled && (
          <div>
            <Label htmlFor="ivaRate">Tasa de IVA (%)</Label>
            <Input
              id="ivaRate"
              name="ivaRate"
              type="number"
              min={0}
              max={100}
              step={1}
              defaultValue={settings.ivaRate}
              className="w-32"
            />
          </div>
        )}
        <p className="text-xs text-gray-400">
          Los montos se guardan con IVA incluido. El neto y el IVA se calculan en
          los reportes.
        </p>
      </Card>

      {mode === "completo" && (
        <Card className="space-y-4 p-5">
          <h2 className="font-semibold text-gray-900">
            Datos para documentos (recetas, carnet, certificados)
          </h2>

          <div>
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Logo"
                  className="h-16 w-16 rounded-lg border border-gray-200 object-contain"
                />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400">
                  Sin logo
                </span>
              )}
              <div className="space-y-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onLogo(e.target.files?.[0])}
                  className="block text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary-700"
                />
                {preview && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreview(null);
                      setLogoField("remove");
                    }}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Quitar logo
                  </button>
                )}
              </div>
            </div>
            <input type="hidden" name="logo" value={logoField} />
            <p className="mt-1 text-xs text-gray-400">PNG/JPG, máx 500 KB.</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="clinicRut">RUT</Label>
              <Input id="clinicRut" name="clinicRut" defaultValue={settings.clinicRut ?? ""} />
            </div>
            <div>
              <Label htmlFor="clinicPhone">Teléfono</Label>
              <Input id="clinicPhone" name="clinicPhone" defaultValue={settings.clinicPhone ?? ""} />
            </div>
            <div>
              <Label htmlFor="clinicEmail">Email</Label>
              <Input id="clinicEmail" name="clinicEmail" defaultValue={settings.clinicEmail ?? ""} />
            </div>
            <div>
              <Label htmlFor="clinicAddress">Dirección</Label>
              <Input id="clinicAddress" name="clinicAddress" defaultValue={settings.clinicAddress ?? ""} />
            </div>
          </div>
        </Card>
      )}

      <FormError message={state.error} />
      {state.ok && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Configuración guardada.
        </p>
      )}
      <SubmitButton>Guardar configuración</SubmitButton>
    </form>
  );
}
