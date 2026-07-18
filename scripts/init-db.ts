import { getDb } from "../lib/db/client";
import { SCHEMA_STATEMENTS } from "../lib/db/schema";

async function main() {
  process.env.TURSO_DATABASE_URL ??= "file:local.db";
  const db = getDb();
  await db.batch(SCHEMA_STATEMENTS, "write");

  const tables = await db.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  console.log(
    `Schema initialized (${process.env.TURSO_DATABASE_URL}). Tables:`,
    tables.rows.map((r) => r.name).join(", ")
  );
}

main().catch((err) => {
  console.error("Schema init failed:", err);
  process.exit(1);
});
