import { shopifyGraphQL } from "./client";

const ORDERS_QUERY = `
  query Orders($first: Int!, $after: String) {
    orders(first: $first, after: $after, sortKey: PROCESSED_AT) {
      nodes {
        id
        name
        processedAt
        createdAt
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        shippingAddress {
          countryCodeV2
        }
        lineItems(first: 50) {
          nodes {
            id
            title
            quantity
            product {
              id
            }
            originalUnitPriceSet {
              shopMoney {
                amount
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const PRODUCTS_QUERY = `
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      nodes {
        id
        title
        featuredMedia {
          preview {
            image {
              url
            }
          }
        }
        priceRangeV2 {
          minVariantPrice {
            amount
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export interface ShopifyOrder {
  id: string;
  name: string;
  processedAt: string;
  createdAt: string;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  shippingAddress: { countryCodeV2: string | null } | null;
  lineItems: {
    nodes: {
      id: string;
      title: string;
      quantity: number;
      product: { id: string } | null;
      originalUnitPriceSet: { shopMoney: { amount: string } };
    }[];
  };
}

export interface ShopifyProduct {
  id: string;
  title: string;
  featuredMedia: { preview: { image: { url: string } | null } | null } | null;
  priceRangeV2: { minVariantPrice: { amount: string } };
}

interface Connection<T> {
  nodes: T[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

const PAGE_SIZE = 100;

async function fetchAll<T>(
  query: string,
  key: "orders" | "products"
): Promise<T[]> {
  const all: T[] = [];
  let after: string | null = null;
  do {
    const data: Record<string, Connection<T>> = await shopifyGraphQL(query, {
      first: PAGE_SIZE,
      after,
    });
    const page = data[key];
    all.push(...page.nodes);
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  return all;
}

export function fetchAllOrders(): Promise<ShopifyOrder[]> {
  return fetchAll<ShopifyOrder>(ORDERS_QUERY, "orders");
}

export function fetchAllProducts(): Promise<ShopifyProduct[]> {
  return fetchAll<ShopifyProduct>(PRODUCTS_QUERY, "products");
}
