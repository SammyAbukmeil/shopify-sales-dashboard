import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { upsertOrders, type OrderRow } from "@/lib/db/upserts";

interface WebhookOrderPayload {
  id: number;
  name: string;
  processed_at: string | null;
  created_at: string;
  total_price: string;
  currency: string;
  shipping_address?: { country_code: string | null } | null;
  line_items: {
    id: number;
    product_id: number | null;
    title: string;
    quantity: number;
    price: string;
  }[];
}

function verifyHmac(rawBody: string, header: string, secret: string): boolean {
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(digest);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}

function toUtcIso(timestamp: string): string {
  return new Date(timestamp).toISOString().replace(".000Z", "Z");
}

export async function POST(req: Request) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256") ?? "";
  if (!verifyHmac(rawBody, hmacHeader, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as WebhookOrderPayload;
  const row: OrderRow = {
    id: String(payload.id),
    name: payload.name,
    processed_at: toUtcIso(payload.processed_at ?? payload.created_at),
    created_at: toUtcIso(payload.created_at),
    total_price: Number(payload.total_price),
    currency: payload.currency,
    country_code: payload.shipping_address?.country_code ?? null,
    line_items: payload.line_items.map((li) => ({
      id: String(li.id),
      product_id: li.product_id === null ? null : String(li.product_id),
      title: li.title,
      quantity: li.quantity,
      price: Number(li.price),
    })),
  };
  await upsertOrders([row]);

  return NextResponse.json({ ok: true });
}
