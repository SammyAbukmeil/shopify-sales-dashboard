export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    processed_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    total_price REAL NOT NULL,
    currency TEXT NOT NULL,
    country_code TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS order_line_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id),
    product_id TEXT,
    title TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT,
    price REAL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_orders_processed_at ON orders (processed_at)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_country_code ON orders (country_code)`,
  `CREATE INDEX IF NOT EXISTS idx_line_items_order_id ON order_line_items (order_id)`,
  `CREATE INDEX IF NOT EXISTS idx_line_items_product_id ON order_line_items (product_id)`,
];
