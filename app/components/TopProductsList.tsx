import Image from "next/image";
import type { TopProduct } from "@/lib/db/queries";
import { formatInteger, formatWholeCurrency } from "@/lib/format";

export function TopProductsList({ products }: { products: TopProduct[] }) {
  const max = products[0]?.revenue ?? 1;
  return (
    <ol className="flex flex-col gap-4">
      {products.map((p) => (
        <li key={p.productId ?? p.title} className="flex items-center gap-3">
          {p.imageUrl ? (
            <Image
              src={p.imageUrl}
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-lg border border-hairline object-cover"
            />
          ) : (
            <div className="size-10 shrink-0 rounded-lg border border-hairline bg-background" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm" title={p.title}>
                {p.title}
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {formatWholeCurrency(p.revenue)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-track/40">
                <div
                  className="h-full rounded-full bg-series"
                  style={{ width: `${Math.max(2, (p.revenue / max) * 100)}%` }}
                />
              </div>
              <span className="shrink-0 text-xs text-ink-muted tabular-nums">
                {formatInteger(p.units)} sold
              </span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
