import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

const VARIANT_BY_STATUS: Record<OrderStatus, BadgeVariant> = {
  pedido: "amber",
  comprado: "blue",
  recibido: "green",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const s = status as OrderStatus;
  return (
    <Badge variant={VARIANT_BY_STATUS[s] ?? "gray"}>
      {ORDER_STATUS_LABELS[s] ?? status}
    </Badge>
  );
}
