import { Badge } from "@/components/ui/badge";

export function StockBadge({
  stock,
  minStock,
}: {
  stock: number;
  minStock: number;
}) {
  if (minStock > 0 && stock === 0) return <Badge variant="red">Sin stock</Badge>;
  if (minStock > 0 && stock <= minStock)
    return <Badge variant="amber">Stock bajo</Badge>;
  if (stock > 0) return <Badge variant="green">OK</Badge>;
  return <Badge variant="gray">Sin stock</Badge>;
}
