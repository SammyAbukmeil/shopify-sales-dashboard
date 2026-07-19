import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhookSignature } from "./webhook";

const SECRET = "shpss_test_secret";

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body, "utf8").digest("base64");
}

describe("verifyWebhookSignature", () => {
  it("accepts a payload signed with the correct secret", () => {
    const body = JSON.stringify({ id: 123, total_price: "42.00" });
    expect(verifyWebhookSignature(body, sign(body, SECRET), SECRET)).toBe(true);
  });

  it("rejects a tampered payload", () => {
    const body = JSON.stringify({ id: 123, total_price: "42.00" });
    const header = sign(body, SECRET);
    const tampered = JSON.stringify({ id: 123, total_price: "9999.00" });
    expect(verifyWebhookSignature(tampered, header, SECRET)).toBe(false);
  });

  it("rejects a payload signed with the wrong secret", () => {
    const body = JSON.stringify({ id: 123 });
    expect(verifyWebhookSignature(body, sign(body, "wrong_secret"), SECRET)).toBe(false);
  });

  it("rejects a malformed header without throwing", () => {
    const body = JSON.stringify({ id: 123 });
    expect(verifyWebhookSignature(body, "", SECRET)).toBe(false);
    expect(verifyWebhookSignature(body, "not-base64-of-right-length", SECRET)).toBe(false);
  });
});
