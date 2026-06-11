import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, services } from "@/lib/db";
import { updateService } from "@/lib/actions/services";
import { PageHeader } from "@/components/ui/page-header";
import { ServiceForm } from "@/components/servicios/service-form";

export const metadata: Metadata = { title: "Editar servicio" };

export default async function EditarServicioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = db
    .select()
    .from(services)
    .where(eq(services.id, Number(id)))
    .get();

  if (!service) notFound();

  return (
    <>
      <PageHeader title="Editar servicio" subtitle={service.name} />
      <ServiceForm
        service={service}
        action={updateService.bind(null, service.id)}
      />
    </>
  );
}
