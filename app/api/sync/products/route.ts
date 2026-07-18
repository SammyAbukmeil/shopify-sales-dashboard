import { NextResponse } from "next/server";
import { fetchAllProducts } from "@/lib/shopify/queries";
import { parseGid } from "@/lib/shopify/gid";
import { upsertProducts, type ProductRow } from "@/lib/db/upserts";
import { isSyncAuthorized } from "@/lib/sync-auth";

export async function POST(req: Request) {
  if (!isSyncAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await fetchAllProducts();
  const rows: ProductRow[] = products.map((p) => ({
    id: parseGid(p.id),
    title: p.title,
    image_url: p.featuredMedia?.preview?.image?.url ?? null,
    price: Number(p.priceRangeV2.minVariantPrice.amount) || null,
  }));
  await upsertProducts(rows);

  return NextResponse.json({ synced: rows.length });
}
