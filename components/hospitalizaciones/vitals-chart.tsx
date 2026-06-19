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
import { CHART } from "@/lib/chart";

const shortDate = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short" });

function fmtShort(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return shortDate.format(new Date(y, m - 1, d));
}

export type VitalPoint = {
  date: string;
  temp: number | null;
  weight: number | null;
};

export function VitalsChart({ points }: { points: VitalPoint[] }) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tickFormatter={fmtShort}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            yAxisId="temp"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            domain={["dataMin - 1", "dataMax + 1"]}
            width={36}
          />
          <YAxis
            yAxisId="weight"
            orientation="right"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            labelFormatter={(label) => formatDate(String(label))}
            formatter={(value, name) => [
              name === "Temperatura" ? `${value} °C` : `${value} kg`,
              name,
            ]}
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="temp"
            name="Temperatura"
            stroke={CHART.expenses}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            yAxisId="weight"
            type="monotone"
            dataKey="weight"
            name="Peso"
            stroke={CHART.income}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
