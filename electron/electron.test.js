const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { createHash } = require("node:crypto");

const { resolveRequestPath } = require("./server");
const { pkce } = require("./oauth");
const { pickDisplay } = require("./liveWindow");

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

test("live view targets a secondary display, never the primary", () => {
  assert.equal(pickDisplay([{ id: 1 }], 1), null, "single display");
  assert.deepEqual(pickDisplay([{ id: 1 }, { id: 2 }], 1), { id: 2 });
  // Primary is not always first in the list.
  assert.deepEqual(pickDisplay([{ id: 2 }, { id: 1 }], 1), { id: 2 });
  assert.equal(pickDisplay([], 1), null, "no displays reported");
});

test("pkce challenge is the S256 digest of its verifier", () => {
  const { verifier, challenge } = pkce();
  assert.equal(
    challenge,
    createHash("sha256").update(verifier).digest("base64url")
  );
  assert.match(verifier, /^[\w-]{43}$/);
});
