import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getCurrencyConfig } from "@/lib/currency";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsForm } from "@/components/configuracion/settings-form";

export const metadata: Metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  if (!(await requireRole("admin"))) redirect("/");
  const settings = getSettings();
  const { currency } = getCurrencyConfig();

  return (
    <>
      <PageHeader
        title="Configuración"
        subtitle="Modo de operación y datos de la veterinaria"
      />
      <SettingsForm settings={settings} currency={currency} />
    </>
  );
}
