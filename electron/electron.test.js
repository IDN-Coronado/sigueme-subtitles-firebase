const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { createHash } = require("node:crypto");

const { resolveRequestPath } = require("./server");
const { pkce } = require("./oauth");

const root = path.join(__dirname, "..", "dist");
const index = path.join(root, "index.html");

test("unknown routes fall back to index.html", async () => {
  assert.equal(await resolveRequestPath(root, "/live"), index);
  assert.equal(await resolveRequestPath(root, "/program/abc123"), index);
});

test("traversal cannot escape the served root", async () => {
  for (const attempt of [
    "/../.env",
    "/../../etc/passwd",
    "/%2e%2e/%2e%2e/.env",
    "/assets/../../.env",
  ]) {
    assert.equal(await resolveRequestPath(root, attempt), index, attempt);
  }
});

test("pkce challenge is the S256 digest of its verifier", () => {
  const { verifier, challenge } = pkce();
  assert.equal(
    challenge,
    createHash("sha256").update(verifier).digest("base64url")
  );
  assert.match(verifier, /^[\w-]{43}$/);
});
