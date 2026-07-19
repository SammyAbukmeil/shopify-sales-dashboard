import { shopifyGraphQL } from "../lib/shopify/client";

const LIST_QUERY = `
  query WebhookSubscriptions {
    webhookSubscriptions(first: 20, topics: [ORDERS_CREATE]) {
      nodes {
        id
        endpoint {
          ... on WebhookHttpEndpoint {
            callbackUrl
          }
        }
      }
    }
  }
`;

const CREATE_MUTATION = `
  mutation WebhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
      webhookSubscription {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

interface ListResult {
  webhookSubscriptions: {
    nodes: { id: string; endpoint: { callbackUrl?: string } }[];
  };
}

interface CreateResult {
  webhookSubscriptionCreate: {
    webhookSubscription: { id: string } | null;
    userErrors: { field: string[] | null; message: string }[];
  };
}

async function main() {
  const baseUrl = process.argv[2];
  if (!baseUrl || !baseUrl.startsWith("https://")) {
    console.error("Usage: npm run register-webhook -- https://<deployment-domain>");
    process.exit(1);
  }
  const callbackUrl = `${baseUrl.replace(/\/$/, "")}/api/webhooks/orders-create`;

  const existing = await shopifyGraphQL<ListResult>(LIST_QUERY);
  const match = existing.webhookSubscriptions.nodes.find(
    (n) => n.endpoint.callbackUrl === callbackUrl
  );
  if (match) {
    console.log(`Already registered: ${callbackUrl} (${match.id})`);
    return;
  }

  const result = await shopifyGraphQL<CreateResult>(CREATE_MUTATION, {
    topic: "ORDERS_CREATE",
    webhookSubscription: { callbackUrl, format: "JSON" },
  });

  const { webhookSubscription, userErrors } = result.webhookSubscriptionCreate;
  if (userErrors.length) {
    console.error("Failed:", userErrors.map((e) => e.message).join("; "));
    process.exit(1);
  }
  console.log(`Registered ORDERS_CREATE -> ${callbackUrl} (${webhookSubscription?.id})`);
}

main().catch((err) => {
  console.error("Webhook registration failed:", err);
  process.exit(1);
});
