"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatSum } from "@/lib/format";

const COLORS = [
  "#4f46e5", // indigo-600
  "#059669", // emerald-600
  "#d97706", // amber-600
  "#e11d48", // rose-600
  "#0891b2", // cyan-600
  "#7c3aed", // violet-600
  "#64748b", // slate-500
];

export type CategoryValue = { name: string; value: number };

export function StockCategoryChart({ data }: { data: CategoryValue[] }) {
  const nonZero = data.filter((d) => d.value > 0);

  if (nonZero.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Ma&apos;lumot yo&apos;q.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="h-56 w-full sm:w-56 sm:shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={nonZero}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="none"
            >
              {nonZero.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatSum(Number(value))}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex flex-1 flex-col gap-2">
        {nonZero.map((d, i) => (
          <li
            key={d.name}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2 text-slate-600">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="truncate">{d.name}</span>
            </span>
            <span className="shrink-0 font-medium text-slate-800">
              {formatSum(d.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
