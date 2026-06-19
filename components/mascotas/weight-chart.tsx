"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate } from "@/lib/dates";

const shortDate = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
});

function fmtShort(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return shortDate.format(new Date(y, m - 1, d));
}

export function WeightChart({ points }: { points: { date: string; grams: number }[] }) {
  const data = points.map((p) => ({ date: p.date, kg: p.grams / 1000 }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tickFormatter={fmtShort}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            width={48}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v} kg`}
            domain={["dataMin - 0.5", "dataMax + 0.5"]}
          />
          <Tooltip
            formatter={(value) => [
              `${Number(value).toLocaleString("es-CL", { maximumFractionDigits: 2 })} kg`,
              "Peso",
            ]}
            labelFormatter={(label) => formatDate(String(label))}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="kg"
            stroke="#0d9488"
            strokeWidth={2}
            dot={{ r: 3, fill: "#0d9488" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
