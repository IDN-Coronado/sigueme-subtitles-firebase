const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { createHash } = require("node:crypto");

const fs = require("node:fs/promises");
const os = require("node:os");

process.env.APOSTELLO_DATA_FILE = path.join(
  os.tmpdir(),
  `apostello-test-${process.pid}.json`
);

const { resolveRequestPath } = require("./server");
const { pkce } = require("./oauth");
const { pickDisplay } = require("./liveWindow");
const store = require("./store");

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

test("store: missing file reads as empty, corrupt file throws", async (t) => {
  const file = store.dataFile();
  await fs.rm(file, { force: true });
  t.after(() => fs.rm(file, { force: true }));

  assert.deepEqual(await store.load(), {}, "ENOENT is not an error");

  // A corrupt file must not read as {} — that looks like "no data yet" and
  // would invite a re-import over the only copy of the library.
  await fs.writeFile(file, "{ this is not json");
  await assert.rejects(() => store.load(), SyntaxError);
});

test("store: concurrent saves do not corrupt the file", async (t) => {
  const file = store.dataFile();
  await fs.rm(file, { force: true });
  t.after(() => fs.rm(file, { force: true }));

  // Fired without awaiting between them: unserialized writes would race on the
  // shared .tmp path and could rename a half-written file into place.
  const writes = Array.from({ length: 20 }, (_, i) =>
    store.save({ songs: Array.from({ length: i + 1 }, (_, n) => ({ id: n })) })
  );
  await Promise.all(writes);

  const final = await store.load();
  assert.equal(final.songs.length, 20, "last write wins intact");
});

test("pkce challenge is the S256 digest of its verifier", () => {
  const { verifier, challenge } = pkce();
  assert.equal(
    challenge,
    createHash("sha256").update(verifier).digest("base64url")
  );
  assert.match(verifier, /^[\w-]{43}$/);
});
