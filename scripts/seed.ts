// Usage:
//   npm run seed (trial batch of 5)
//   npm run seed -- --count 300 --days 180
import { shopifyGraphQL } from "../lib/shopify/client";

const args = process.argv.slice(2);
function argValue(name: string, fallback: number): number {
  const i = args.indexOf(`--${name}`);
  if (i === -1 || i === args.length - 1) return fallback;
  const n = Number(args[i + 1]);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid value for --${name}`);
  }
  return n;
}

const COUNT = argValue("count", 5);
const DAYS = argValue("days", 180);

const COUNTRIES: { code: string; city: string; weight: number }[] = [
  { code: "US", city: "New York", weight: 35 },
  { code: "AU", city: "Sydney", weight: 20 },
  { code: "GB", city: "London", weight: 18 },
  { code: "DE", city: "Berlin", weight: 12 },
  { code: "JP", city: "Tokyo", weight: 6 },
  { code: "CA", city: "Toronto", weight: 5 },
  { code: "FR", city: "Paris", weight: 4 },
];

const FIRST_NAMES = ["Alex", "Sam", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie"];
const LAST_NAMES = ["Smith", "Jones", "Garcia", "Chen", "Muller", "Tanaka", "Brown", "Wilson"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickCountry() {
  const total = COUNTRIES.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const c of COUNTRIES) {
    r -= c.weight;
    if (r <= 0) return c;
  }
  return COUNTRIES[0];
}

function randomProcessedAt(): string {
  const daysAgo = Math.floor(DAYS * Math.pow(Math.random(), 0.7));
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(
    Math.floor(Math.random() * 24),
    Math.floor(Math.random() * 60),
    Math.floor(Math.random() * 60),
    0
  );
  return d.toISOString();
}

const VARIANTS_QUERY = `
  query ProductVariants($first: Int!, $after: String) {
    productVariants(first: $first, after: $after) {
      nodes {
        id
        price
        product {
          title
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const SHOP_QUERY = `
  query {
    shop {
      currencyCode
    }
  }
`;

const ORDER_CREATE_MUTATION = `
  mutation OrderCreate($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) {
    orderCreate(order: $order, options: $options) {
      order {
        id
        name
      }
      userErrors {
        field
        message
      }
    }
  }
`;

interface Variant {
  id: string;
  price: string;
  product: { title: string };
}

async function fetchVariants(): Promise<Variant[]> {
  const all: Variant[] = [];
  let after: string | null = null;
  do {
    const data: {
      productVariants: {
        nodes: Variant[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    } = await shopifyGraphQL(VARIANTS_QUERY, { first: 100, after });
    all.push(...data.productVariants.nodes);
    after = data.productVariants.pageInfo.hasNextPage
      ? data.productVariants.pageInfo.endCursor
      : null;
  } while (after);
  return all;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const shop = await shopifyGraphQL<{ shop: { currencyCode: string } }>(SHOP_QUERY);
  const currency = shop.shop.currencyCode;
  const variants = await fetchVariants();
  if (variants.length === 0) {
    throw new Error("No product variants found; seed the catalog first");
  }
  console.log(
    `Creating ${COUNT} orders over ${DAYS} days (${variants.length} variants, currency ${currency})`
  );

  let created = 0;
  let failed = 0;
  for (let i = 0; i < COUNT; i++) {
    const country = pickCountry();
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const itemCount = 1 + Math.floor(Math.random() * 3);
    const lineItems = Array.from({ length: itemCount }, () => ({
      variantId: pick(variants).id,
      quantity: 1 + Math.floor(Math.random() * 3),
    }));

    const order = {
      currency,
      processedAt: randomProcessedAt(),
      financialStatus: "PAID",
      lineItems,
      shippingAddress: {
        firstName,
        lastName,
        address1: "1 Example Street",
        city: country.city,
        countryCode: country.code,
      },
    };

    try {
      // Dev stores cap order creation at 5 per minute. That limit surfaces
      // as a "Too many attempts" userError, so wait out the window and
      // retry the same order.
      let result;
      for (let retry = 0; ; retry++) {
        result = await shopifyGraphQL<{
          orderCreate: {
            order: { id: string; name: string } | null;
            userErrors: { field: string[] | null; message: string }[];
          };
        }>(ORDER_CREATE_MUTATION, {
          order,
          options: { sendReceipt: false, sendFulfillmentReceipt: false },
        });
        const rateLimited = result.orderCreate.userErrors.some((e) =>
          e.message.includes("Too many attempts")
        );
        if (!rateLimited || retry >= 20) break;
        await sleep(15000);
      }

      if (result.orderCreate.userErrors.length > 0) {
        failed++;
        console.error(
          `Order ${i + 1} failed:`,
          result.orderCreate.userErrors.map((e) => e.message).join("; ")
        );
      } else {
        created++;
        if (created % 25 === 0 || created === COUNT) {
          console.log(`Progress: ${created}/${COUNT}`);
        }
      }
    } catch (err) {
      failed++;
      console.error(`Order ${i + 1} threw:`, err);
    }

    await sleep(300);
  }

  console.log(`Done. Created ${created}, failed ${failed}.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
