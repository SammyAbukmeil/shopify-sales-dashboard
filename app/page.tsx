import {
  getKpis,
  getOrdersByCountry,
  getRevenueByDay,
  getTopProducts,
  type RevenuePoint,
} from "@/lib/db/queries";
import { formatCompactCurrency, formatCurrency, formatInteger } from "@/lib/format";
import { toWeeklySeries } from "@/lib/weekly-series";
import { StatCard } from "./components/StatCard";
import { RevenueChart } from "./components/RevenueChart";
import { TopProductsList } from "./components/TopProductsList";
import { CountryChart, type CountryDatum } from "./components/CountryChart";

// Opt out of static rendering to reflect webhook writes on every request
export const dynamic = "force-dynamic";

const REPORTING_PERIOD_DAYS = 180;

function firstDayOfEachMonth(points: RevenuePoint[]): string[] {
  const seen = new Set<string>();
  const ticks: string[] = [];
  for (const p of points) {
    const month = p.day.slice(0, 7);
    if (!seen.has(month)) {
      seen.add(month);
      ticks.push(p.day);
    }
  }
  return ticks;
}

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

export default async function Dashboard() {
  const [kpis, revenueByDay, topProducts, ordersByCountry] = await Promise.all([
    getKpis(REPORTING_PERIOD_DAYS),
    getRevenueByDay(REPORTING_PERIOD_DAYS),
    getTopProducts(REPORTING_PERIOD_DAYS, 8),
    getOrdersByCountry(REPORTING_PERIOD_DAYS),
  ]);

  const series = toWeeklySeries(revenueByDay, REPORTING_PERIOD_DAYS);
  const monthTicks = firstDayOfEachMonth(series);
  const countries: CountryDatum[] = ordersByCountry.slice(0, 8).map((c) => ({
    country: c.countryCode ? (countryNames.of(c.countryCode) ?? c.countryCode) : "Unknown",
    orders: c.orders,
    revenue: c.revenue,
  }));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sales dashboard</h1>
        <p className="text-sm text-ink-secondary">Last {REPORTING_PERIOD_DAYS} days</p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total revenue" value={formatCompactCurrency(kpis.totalRevenue)} />
        <StatCard label="Orders" value={formatInteger(kpis.orderCount)} />
        <StatCard label="Average order value" value={formatCurrency(kpis.averageOrderValue)} />
      </section>

      <section className="mt-4 rounded-xl border border-hairline bg-surface p-6">
        <h2 className="text-sm font-medium text-ink-secondary">Revenue over time</h2>
        <div className="mt-4">
          <RevenueChart data={series} monthTicks={monthTicks} />
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-hairline bg-surface p-6">
          <h2 className="text-sm font-medium text-ink-secondary">Top products by revenue</h2>
          <div className="mt-4">
            <TopProductsList products={topProducts} />
          </div>
        </section>

        <section className="rounded-xl border border-hairline bg-surface p-6">
          <h2 className="text-sm font-medium text-ink-secondary">Orders by country</h2>
          <div className="mt-4">
            <CountryChart data={countries} />
          </div>
        </section>
      </div>
    </main>
  );
}
