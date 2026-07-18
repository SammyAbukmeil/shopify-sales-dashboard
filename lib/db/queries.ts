import { getDb } from "./client";

export interface Kpis {
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface RevenuePoint {
  day: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string | null;
  title: string;
  imageUrl: string | null;
  revenue: number;
  units: number;
}

export interface CountryStat {
  countryCode: string | null;
  orders: number;
  revenue: number;
}

const SINCE_CLAUSE = `processed_at >= datetime('now', '-' || ? || ' days')`;

export async function getKpis(days = 180): Promise<Kpis> {
  const result = await getDb().execute({
    sql: `SELECT COUNT(*) AS order_count,
                 COALESCE(SUM(total_price), 0) AS total_revenue
          FROM orders
          WHERE ${SINCE_CLAUSE}`,
    args: [days],
  });
  const row = result.rows[0];
  const orderCount = Number(row.order_count);
  const totalRevenue = Number(row.total_revenue);
  return {
    totalRevenue,
    orderCount,
    averageOrderValue: orderCount === 0 ? 0 : totalRevenue / orderCount,
  };
}

export async function getRevenueByDay(days = 180): Promise<RevenuePoint[]> {
  const result = await getDb().execute({
    sql: `SELECT date(processed_at) AS day,
                 ROUND(SUM(total_price), 2) AS revenue,
                 COUNT(*) AS orders
          FROM orders
          WHERE ${SINCE_CLAUSE}
          GROUP BY day
          ORDER BY day`,
    args: [days],
  });
  return result.rows.map((r) => ({
    day: String(r.day),
    revenue: Number(r.revenue),
    orders: Number(r.orders),
  }));
}

export async function getTopProducts(days = 180, limit = 10): Promise<TopProduct[]> {
  const result = await getDb().execute({
    sql: `SELECT li.product_id,
                 COALESCE(p.title, li.title) AS title,
                 p.image_url,
                 ROUND(SUM(li.quantity * li.price), 2) AS revenue,
                 SUM(li.quantity) AS units
          FROM order_line_items li
          JOIN orders o ON o.id = li.order_id
          LEFT JOIN products p ON p.id = li.product_id
          WHERE o.${SINCE_CLAUSE}
          GROUP BY COALESCE(li.product_id, li.title)
          ORDER BY revenue DESC
          LIMIT ?`,
    args: [days, limit],
  });
  return result.rows.map((r) => ({
    productId: r.product_id === null ? null : String(r.product_id),
    title: String(r.title),
    imageUrl: r.image_url === null ? null : String(r.image_url),
    revenue: Number(r.revenue),
    units: Number(r.units),
  }));
}

export async function getOrdersByCountry(days = 180): Promise<CountryStat[]> {
  const result = await getDb().execute({
    sql: `SELECT country_code,
                 COUNT(*) AS orders,
                 ROUND(SUM(total_price), 2) AS revenue
          FROM orders
          WHERE ${SINCE_CLAUSE}
          GROUP BY country_code
          ORDER BY orders DESC`,
    args: [days],
  });
  return result.rows.map((r) => ({
    countryCode: r.country_code === null ? null : String(r.country_code),
    orders: Number(r.orders),
    revenue: Number(r.revenue),
  }));
}
