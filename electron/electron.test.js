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

test("live view never lands on the display the console is on", () => {
  // Null means "no other screen" — the caller then opens a framed, windowed
  // live view instead of a frameless fullscreen one that could not be closed.
  assert.equal(pickDisplay([{ id: 1 }], 1), null, "single display");
  assert.equal(pickDisplay([], 1), null, "no displays reported");

  assert.deepEqual(pickDisplay([{ id: 1 }, { id: 2 }], 1), { id: 2 });
  // The console's display is not always first in the list.
  assert.deepEqual(pickDisplay([{ id: 2 }, { id: 1 }], 1), { id: 2 });

  // The regression: console dragged onto the secondary screen. Keying on
  // "not primary" would have returned display 2 and covered the console.
  assert.deepEqual(pickDisplay([{ id: 1 }, { id: 2 }], 2), { id: 1 });
});

test("pkce challenge is the S256 digest of its verifier", () => {
  const { verifier, challenge } = pkce();
  assert.equal(
    challenge,
    createHash("sha256").update(verifier).digest("base64url")
  );
  assert.match(verifier, /^[\w-]{43}$/);
});
