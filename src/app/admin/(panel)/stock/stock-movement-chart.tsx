"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type DailyMovement = { date: string; inflow: number; outflow: number };

export function StockMovementChart({ data }: { data: DailyMovement[] }) {
  const hasData = data.some((d) => d.inflow > 0 || d.outflow > 0);

  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        So&apos;nggi 30 kunda harakat yo&apos;q.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={0} margin={{ left: -20 }}>
          <CartesianGrid vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              fontSize: 13,
            }}
            labelFormatter={(label) => `Sana: ${label}`}
            formatter={(value, name) => [
              String(value),
              name === "inflow" ? "Kirim" : "Chiqim",
            ]}
          />
          <Bar dataKey="inflow" fill="#059669" radius={[3, 3, 0, 0]} />
          <Bar dataKey="outflow" fill="#e11d48" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
