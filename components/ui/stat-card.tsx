import { Card } from "./card";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "negative" | "accent";
}) {
  const valueColor = {
    default: "text-gray-900",
    positive: "text-emerald-600",
    negative: "text-red-600",
    accent: "text-primary-700",
  }[tone];

  return (
    <Card className="p-4">
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${valueColor}`}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
    </Card>
  );
}
