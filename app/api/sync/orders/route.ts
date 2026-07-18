import { NextResponse } from "next/server";
import { fetchAllOrders } from "@/lib/shopify/queries";
import { parseGid } from "@/lib/shopify/gid";
import { upsertOrders, type OrderRow } from "@/lib/db/upserts";
import { isSyncAuthorized } from "@/lib/sync-auth";

export async function POST(req: Request) {
  if (!isSyncAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await fetchAllOrders();
  const rows: OrderRow[] = orders.map((o) => ({
    id: parseGid(o.id),
    name: o.name,
    processed_at: o.processedAt,
    created_at: o.createdAt,
    total_price: Number(o.totalPriceSet.shopMoney.amount),
    currency: o.totalPriceSet.shopMoney.currencyCode,
    country_code: o.shippingAddress?.countryCodeV2 ?? null,
    line_items: o.lineItems.nodes.map((li) => ({
      id: parseGid(li.id),
      product_id: li.product ? parseGid(li.product.id) : null,
      title: li.title,
      quantity: li.quantity,
      price: Number(li.originalUnitPriceSet.shopMoney.amount),
    })),
  }));
  await upsertOrders(rows);

  return NextResponse.json({
    synced: rows.length,
    lineItems: rows.reduce((s, r) => s + r.line_items.length, 0),
  });
}
