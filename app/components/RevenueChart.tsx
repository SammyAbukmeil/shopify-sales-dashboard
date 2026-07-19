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
import type { RevenuePoint } from "@/lib/db/queries";
import {
  formatCompactCurrency,
  formatCurrency,
  formatDay,
  formatMonth,
} from "@/lib/format";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: RevenuePoint }[];
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm shadow-sm">
      <div className="text-ink-secondary">Week of {formatDay(label)}</div>
      <div className="font-semibold">{formatCurrency(point.revenue)}</div>
      <div className="text-ink-secondary">
        {point.orders} {point.orders === 1 ? "order" : "orders"}
      </div>
    </div>
  );
}

export function RevenueChart({
  data,
  monthTicks,
}: {
  data: RevenuePoint[];
  monthTicks: string[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid
          vertical={false}
          stroke="var(--gridline)"
          strokeWidth={1}
        />
        <XAxis
          dataKey="day"
          ticks={monthTicks}
          tickFormatter={formatMonth}
          tickLine={false}
          axisLine={{ stroke: "var(--baseline)" }}
          tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
          interval="preserveStart"
        />
        <YAxis
          tickFormatter={formatCompactCurrency}
          tickLine={false}
          axisLine={false}
          width={52}
          tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--baseline)" }} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--series)"
          strokeWidth={2}
          fill="var(--series-wash)"
          activeDot={{ r: 4, fill: "var(--series)", stroke: "var(--surface)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
