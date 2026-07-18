const API_VERSION = "2025-07";
const MAX_RETRIES = 3;

interface GraphQLError {
  message: string;
  extensions?: { code?: string };
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

function getConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (!domain || !token) {
    throw new Error(
      "SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN must be set"
    );
  }
  return { domain, token };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function shopifyGraphQL<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const { domain, token } = getConfig();
  const url = `https://${domain}/admin/api/${API_VERSION}/graphql.json`;

  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (res.status === 429 && attempt <= MAX_RETRIES) {
      const retryAfter = Number(res.headers.get("Retry-After")) || 2;
      await sleep(retryAfter * 1000);
      continue;
    }

    if (!res.ok) {
      throw new Error(`Shopify API HTTP ${res.status}: ${await res.text()}`);
    }

    const body = (await res.json()) as GraphQLResponse<T>;

    if (body.errors?.length) {
      const throttled = body.errors.some(
        (e) => e.extensions?.code === "THROTTLED"
      );
      if (throttled && attempt <= MAX_RETRIES) {
        await sleep(1000 * attempt);
        continue;
      }
      throw new Error(
        `Shopify GraphQL errors: ${body.errors.map((e) => e.message).join("; ")}`
      );
    }

    if (!body.data) {
      throw new Error("Shopify GraphQL response contained no data");
    }
    return body.data;
  }
}
