// Frontend\components\performance-chart.tsx

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

export interface PerformanceChartPoint {
  label: string;
  score: number;
}

export function PerformanceChart({ data }: { data: PerformanceChartPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-white/10 text-sm text-slate-500">
        Complete an interview to see your score trend here.
      </div>
    );
  }

  return (
    <div
      className="h-64 w-full"
      aria-label="Interview performance trend over your recent sessions"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 12, right: 12, left: -18, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="4 4"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.1)",
              background: "#1b1e2a",
              color: "#f8fafc",
              boxShadow: "0 12px 30px rgba(0,0,0,.3)",
            }}
            formatter={(value) => [`${value}%`, "Score"]}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--chart-1)"
            strokeWidth={3}
            dot={{
              fill: "#151823",
              stroke: "var(--chart-1)",
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
