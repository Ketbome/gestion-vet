import { Badge, type BadgeVariant } from "@/components/ui/badge";
import {
  APPOINTMENT_STATUS_LABELS,
  type AppointmentStatus,
} from "@/lib/constants";

const VARIANT_BY_STATUS: Record<AppointmentStatus, BadgeVariant> = {
  solicitada: "amber",
  confirmada: "blue",
  completada: "green",
  cancelada: "gray",
};

export function AppointmentStatusBadge({ status }: { status: string }) {
  const s = status as AppointmentStatus;
  return (
    <Badge variant={VARIANT_BY_STATUS[s] ?? "gray"}>
      {APPOINTMENT_STATUS_LABELS[s] ?? status}
    </Badge>
  );
}
