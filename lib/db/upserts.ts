import type { InStatement } from "@libsql/client";
import { getDb } from "./client";

export interface OrderRow {
  id: string;
  name: string;
  processed_at: string;
  created_at: string;
  total_price: number;
  currency: string;
  country_code: string | null;
  line_items: LineItemRow[];
}

export interface LineItemRow {
  id: string;
  product_id: string | null;
  title: string;
  quantity: number;
  price: number;
}

export interface ProductRow {
  id: string;
  title: string;
  image_url: string | null;
  price: number | null;
}

function orderStatements(order: OrderRow): InStatement[] {
  const stmts: InStatement[] = [
    {
      sql: `INSERT INTO orders (id, name, processed_at, created_at, total_price, currency, country_code)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
              name = excluded.name,
              processed_at = excluded.processed_at,
              created_at = excluded.created_at,
              total_price = excluded.total_price,
              currency = excluded.currency,
              country_code = excluded.country_code`,
      args: [
        order.id,
        order.name,
        order.processed_at,
        order.created_at,
        order.total_price,
        order.currency,
        order.country_code,
      ],
    },
  ];
  for (const li of order.line_items) {
    stmts.push({
      sql: `INSERT INTO order_line_items (id, order_id, product_id, title, quantity, price)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
              product_id = excluded.product_id,
              title = excluded.title,
              quantity = excluded.quantity,
              price = excluded.price`,
      args: [li.id, order.id, li.product_id, li.title, li.quantity, li.price],
    });
  }
  return stmts;
}

export async function upsertOrders(orders: OrderRow[]): Promise<void> {
  if (orders.length === 0) return;
  await getDb().batch(orders.flatMap(orderStatements), "write");
}

export async function upsertProducts(products: ProductRow[]): Promise<void> {
  if (products.length === 0) return;
  const stmts: InStatement[] = products.map((p) => ({
    sql: `INSERT INTO products (id, title, image_url, price)
          VALUES (?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET
            title = excluded.title,
            image_url = excluded.image_url,
            price = excluded.price`,
    args: [p.id, p.title, p.image_url, p.price],
  }));
  await getDb().batch(stmts, "write");
}
