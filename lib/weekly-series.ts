import type { RevenuePoint } from "@/lib/db/queries";

// Lots of orders results in a daily series with lots of spikes/noise, so bucket into weeks
export function toWeeklySeries(points: RevenuePoint[], days: number, now = new Date()): RevenuePoint[] {
  const weekStart = (d: Date): string => {
    const monday = new Date(d);
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    return monday.toISOString().slice(0, 10);
  };

  const byWeek = new Map<string, RevenuePoint>();
  const cursor = new Date(now);
  cursor.setUTCDate(cursor.getUTCDate() - days + 1);
  for (let i = 0; i < days; i += 7) {
    const week = weekStart(cursor);
    byWeek.set(week, { day: week, revenue: 0, orders: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  for (const p of points) {
    const bucket = byWeek.get(weekStart(new Date(`${p.day}T00:00:00Z`)));
    if (!bucket) continue;
    bucket.revenue = Math.round((bucket.revenue + p.revenue) * 100) / 100;
    bucket.orders += p.orders;
  }
  return [...byWeek.values()];
}
