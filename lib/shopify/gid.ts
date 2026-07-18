// GraphQL returns global IDs like "gid://shopify/Order/123" while webhook
// payloads carry the bare numeric ID. Store the numeric part so both write
// paths address the same rows.
export function parseGid(gid: string): string {
  return gid.substring(gid.lastIndexOf("/") + 1);
}
