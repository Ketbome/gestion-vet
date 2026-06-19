"use client";

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/currency";
import { CHART, PIE_COLORS, compactCurrency } from "@/lib/chart";

type MonthPoint = { label: string; income: number; expenses: number; profit: number };
type Slice = { label: string; total: number };

export function MonthlyChart({ data }: { data: MonthPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={compactCurrency}
            width={56}
          />
          <Tooltip
            formatter={(value, name) => [formatCurrency(Number(value)), name]}
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="income" name="Ingresos" fill={CHART.income} radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" name="Gastos" fill={CHART.expenses} radius={[4, 4, 0, 0]} />
          <Line
            type="monotone"
            dataKey="profit"
            name="Ganancia"
            stroke={CHART.profit}
            strokeWidth={2}
            dot={{ r: 3, fill: CHART.profit }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BreakdownPie({ data }: { data: Slice[] }) {
  if (data.length === 0)
    return <p className="py-8 text-center text-sm text-gray-400">Sin datos.</p>;

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="label"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [formatCurrency(Number(value)), name]}
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
