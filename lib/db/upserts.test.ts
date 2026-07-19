import { beforeAll, describe, expect, it } from "vitest";
import { SCHEMA_STATEMENTS } from "./schema";
import { upsertOrders, upsertProducts, type OrderRow } from "./upserts";
import { getDb } from "./client";

process.env.TURSO_DATABASE_URL = ":memory:";

const order: OrderRow = {
  id: "1001",
  name: "#1001",
  processed_at: "2026-07-01T10:00:00Z",
  created_at: "2026-07-01T10:00:00Z",
  total_price: 120.5,
  currency: "USD",
  country_code: "US",
  line_items: [
    { id: "2001", product_id: "3001", title: "Tee", quantity: 2, price: 30 },
    { id: "2002", product_id: null, title: "Gift wrap", quantity: 1, price: 60.5 },
  ],
};

async function count(table: string): Promise<number> {
  const result = await getDb().execute(`SELECT COUNT(*) AS n FROM ${table}`);
  return Number(result.rows[0].n);
}

beforeAll(async () => {
  await getDb().batch(SCHEMA_STATEMENTS, "write");
});

describe("upsertOrders", () => {
  it("inserts an order with its line items", async () => {
    await upsertOrders([order]);
    expect(await count("orders")).toBe(1);
    expect(await count("order_line_items")).toBe(2);
  });

  it("stores the order once even when the same webhook is delivered twice", async () => {
    await upsertOrders([order]);
    await upsertOrders([order]);
    expect(await count("orders")).toBe(1);
    expect(await count("order_line_items")).toBe(2);
  });

  it("updates in place when the same order arrives with new values", async () => {
    await upsertOrders([
      {
        ...order,
        total_price: 99.99,
        country_code: "AU",
        line_items: [{ ...order.line_items[0], quantity: 5 }],
      },
    ]);
    expect(await count("orders")).toBe(1);
    const updated = await getDb().execute({
      sql: "SELECT total_price, country_code FROM orders WHERE id = ?",
      args: [order.id],
    });
    expect(updated.rows[0].total_price).toBe(99.99);
    expect(updated.rows[0].country_code).toBe("AU");
    const item = await getDb().execute({
      sql: "SELECT quantity FROM order_line_items WHERE id = ?",
      args: ["2001"],
    });
    expect(Number(item.rows[0].quantity)).toBe(5);
  });
});

describe("upsertProducts", () => {
  it("stores each product once across repeat syncs and applies changed values", async () => {
    const product = { id: "3001", title: "Tee", image_url: null, price: 30 };
    await upsertProducts([product]);
    await upsertProducts([{ ...product, price: 35 }]);
    expect(await count("products")).toBe(1);
    const row = await getDb().execute({
      sql: "SELECT price FROM products WHERE id = ?",
      args: [product.id],
    });
    expect(row.rows[0].price).toBe(35);
  });
});
