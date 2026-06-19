"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/currency";
import { CHART, compactCurrency } from "@/lib/chart";

export function RevenueTrend({ data }: { data: { label: string; income: number }[] }) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.income} stopOpacity={0.3} />
              <stop offset="100%" stopColor={CHART.income} stopOpacity={0} />
            </linearGradient>
          </defs>
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
            formatter={(value) => [formatCurrency(Number(value)), "Ingresos"]}
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke={CHART.income}
            strokeWidth={2}
            fill="url(#incomeFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
