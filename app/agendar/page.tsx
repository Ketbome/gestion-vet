import type { Metadata } from "next";
import { and, asc, eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { today } from "@/lib/dates";
import { Logo } from "@/components/logo";
import { Card } from "@/components/ui/card";
import { PublicBookingForm } from "@/components/agenda/public-booking-form";

export const metadata: Metadata = { title: "Agendar cita" };

export const dynamic = "force-dynamic";

export default function AgendarPage() {
  const settings = getSettings();
  const available =
    settings.clinicMode === "completo" && settings.publicBookingEnabled;

  const vets = available
    ? db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(and(eq(users.active, true), eq(users.role, "veterinario")))
        .orderBy(asc(users.name))
        .all()
    : [];

  return (
    <div className="min-h-dvh bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
            {settings.clinicName || "Agenda tu cita"}
          </h1>
          {settings.bookingHoursNote && (
            <p className="mt-1 text-sm text-gray-500">{settings.bookingHoursNote}</p>
          )}
        </div>

        {available ? (
          <PublicBookingForm minDate={today()} vets={vets} />
        ) : (
          <Card className="p-6 text-center">
            <p className="text-sm text-gray-600">
              El agendamiento en línea no está disponible en este momento.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
