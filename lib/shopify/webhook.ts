import { createHmac, timingSafeEqual } from "crypto";

export function verifyWebhookSignature(rawBody: string, header: string, secret: string): boolean {
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(digest);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}
