import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Plantillas" };

const TEMPLATES = [
  {
    base: "/plantillas/receta",
    label: "Receta médica en blanco",
    description: "Prescripción de medicamentos para completar a mano",
  },
  {
    base: "/plantillas/carnet",
    label: "Carnet de vacunación en blanco",
    description: "Tabla de vacunas y desparasitaciones con espacio para el papel",
  },
  {
    base: "/plantillas/ficha",
    label: "Ficha de admisión en blanco",
    description: "Datos del paciente, anamnesis y examen físico",
  },
];

const SIZES = [
  { param: "", label: "A4", sub: "21×29.7 cm" },
  { param: "?size=a5", label: "A5", sub: "14×21 cm" },
];

export default function PlantillasPage() {
  return (
    <>
      <PageHeader title="Plantillas" />
      <p className="mb-4 text-sm text-gray-500">
        Documentos en blanco para imprimir y rellenar a mano.
      </p>
      <div className="space-y-3">
        {TEMPLATES.map((t) => (
          <Card key={t.base} className="p-4">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Icon name="document" />
              </span>
              <div className="flex-1">
                <span className="block font-semibold text-gray-900">{t.label}</span>
                <span className="block text-sm text-gray-500">{t.description}</span>
                <div className="mt-3 flex gap-2">
                  {SIZES.map((s) => (
                    <a
                      key={s.param}
                      href={`${t.base}${s.param}`}
                      className="inline-flex flex-col items-center rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-primary-700 transition hover:bg-primary-100"
                    >
                      <span className="text-sm font-semibold">{s.label}</span>
                      <span className="text-xs text-primary-500">{s.sub}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
