"use client";

import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatInteger } from "@/lib/format";

export interface CountryDatum {
  country: string;
  orders: number;
  revenue: number;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: CountryDatum }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm shadow-sm">
      <div className="text-ink-secondary">{point.country}</div>
      <div className="font-semibold">{formatInteger(point.orders)} orders</div>
      <div className="text-ink-secondary">{formatCurrency(point.revenue)}</div>
    </div>
  );
}

export function CountryChart({ data }: { data: CountryDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={data.length * 36 + 8}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 44, left: 0, bottom: 0 }}
        barSize={16}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="country"
          width={92}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--ink-secondary)", fontSize: 13 }}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--gridline)", opacity: 0.4 }} />
        <Bar dataKey="orders" fill="var(--series)" radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="orders"
            position="right"
            formatter={(value) => formatInteger(Number(value))}
            style={{ fill: "var(--ink-secondary)", fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
