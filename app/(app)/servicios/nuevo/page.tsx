import type { Metadata } from "next";
import { createService } from "@/lib/actions/services";
import { PageHeader } from "@/components/ui/page-header";
import { ServiceForm } from "@/components/servicios/service-form";

export const metadata: Metadata = { title: "Nuevo servicio" };

export default function NuevoServicioPage() {
  return (
    <>
      <PageHeader title="Nuevo servicio" />
      <ServiceForm action={createService} />
    </>
  );
}
