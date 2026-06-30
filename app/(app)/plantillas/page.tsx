import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Plantillas" };

const TEMPLATES = [
  {
    href: "/plantillas/receta",
    label: "Receta médica en blanco",
    description: "Para prescribir medicamentos manualmente",
  },
  {
    href: "/plantillas/carnet",
    label: "Carnet de vacunación en blanco",
    description: "Tabla de vacunas para completar a mano",
  },
  {
    href: "/plantillas/ficha",
    label: "Ficha de admisión en blanco",
    description: "Datos del paciente, anamnesis y examen físico",
  },
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
          <a key={t.href} href={t.href} download className="block">
            <Card className="flex items-center gap-4 p-4 transition hover:border-primary-300">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Icon name="document" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-gray-900">{t.label}</span>
                <span className="block text-sm text-gray-500">{t.description}</span>
              </span>
              <span className="text-sm text-primary-600">↓ PDF</span>
            </Card>
          </a>
        ))}
      </div>
    </>
  );
}
