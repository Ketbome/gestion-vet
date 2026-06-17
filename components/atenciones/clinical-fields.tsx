import type { Attention } from "@/lib/db/schema";
import { Input, Label, Select, Textarea } from "@/components/ui/form-fields";

export type VetOption = { id: number; name: string };

export function ClinicalFields({
  vets,
  defaultVetId,
  attention,
  includeWeight = false,
}: {
  vets: VetOption[];
  defaultVetId?: number;
  attention?: Attention;
  includeWeight?: boolean;
}) {
  const vetDefault = attention?.vetId ?? defaultVetId ?? "";

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="vetId">Veterinario que atiende</Label>
        <Select id="vetId" name="vetId" defaultValue={vetDefault}>
          <option value="">Sin asignar</option>
          {vets.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </Select>
      </div>

      {includeWeight && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="weightKg">Peso en kg</Label>
            <Input
              id="weightKg"
              name="weightKg"
              type="number"
              min={0}
              step={0.1}
              inputMode="decimal"
              defaultValue={attention?.weightGrams ? attention.weightGrams / 1000 : ""}
            />
          </div>
          <div>
            <Label htmlFor="temperature">Temperatura °C</Label>
            <Input
              id="temperature"
              name="temperature"
              type="number"
              min={0}
              step={0.1}
              inputMode="decimal"
              defaultValue={attention?.temperature ?? ""}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="heartRate">Frec. cardíaca</Label>
          <Input
            id="heartRate"
            name="heartRate"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="lpm"
            defaultValue={attention?.heartRate ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="respRate">Frec. respiratoria</Label>
          <Input
            id="respRate"
            name="respRate"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="rpm"
            defaultValue={attention?.respRate ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="mucous">Mucosas</Label>
          <Input
            id="mucous"
            name="mucous"
            placeholder="Ej: rosadas"
            defaultValue={attention?.mucous ?? ""}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="anamnesis">Anamnesis</Label>
        <Textarea
          id="anamnesis"
          name="anamnesis"
          placeholder="Motivo de consulta, historia…"
          defaultValue={attention?.anamnesis ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="examFindings">Examen físico</Label>
        <Textarea
          id="examFindings"
          name="examFindings"
          placeholder="Hallazgos al examen"
          defaultValue={attention?.examFindings ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="diagnosis">Diagnóstico</Label>
        <Textarea
          id="diagnosis"
          name="diagnosis"
          placeholder="Presuntivo o definitivo"
          defaultValue={attention?.diagnosis ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="treatment">Tratamiento / indicaciones</Label>
        <Textarea
          id="treatment"
          name="treatment"
          placeholder="Plan terapéutico"
          defaultValue={attention?.treatment ?? ""}
        />
      </div>
    </div>
  );
}
