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

const { resolveRequestPath, resolveWithin, parseRange } = require("./server");
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

test("media paths cannot escape the media root", () => {
  const root = path.join(os.tmpdir(), "apostello-media");

  assert.equal(
    resolveWithin(root, "/general/song.mp4"),
    path.join(root, "general", "song.mp4")
  );

  // The invariant is containment, not rejection: a leading ".." on an absolute
  // path is collapsed by normalize, so these land harmlessly inside the root
  // rather than returning null. Either outcome is safe; escaping is not.
  for (const attempt of [
    "/../data.json",
    "/../../.env",
    "/general/../../../data.json",
    "/%2e%2e/data.json",
    "/general/%2e%2e/%2e%2e/.env",
  ]) {
    const resolved = resolveWithin(root, attempt);
    if (resolved === null) continue;
    const relative = path.relative(root, resolved);
    assert.ok(
      !relative.startsWith("..") && !path.isAbsolute(relative),
      `${attempt} escaped to ${resolved}`
    );
  }

  // A genuinely absolute path is rejected outright.
  assert.equal(resolveWithin(root, "/C:/Windows/system.ini"), null);
});

test("range parsing covers what a <video> actually sends", () => {
  const size = 1000;

  assert.equal(parseRange(undefined, size), null, "no header = full response");
  assert.equal(parseRange("bytes=0-", size).end, 999, "open-ended probe");
  assert.deepEqual(parseRange("bytes=100-199", size), { start: 100, end: 199 });
  // Seeking past the middle: end beyond EOF is clamped, not rejected.
  assert.deepEqual(parseRange("bytes=900-5000", size), { start: 900, end: 999 });
  // bytes=-N is the trailing N bytes — how players find a moov atom at EOF.
  assert.deepEqual(parseRange("bytes=-100", size), { start: 900, end: 999 });

  // Must 416 rather than silently returning the whole file.
  assert.equal(parseRange("bytes=1000-", size), "unsatisfiable", "start at EOF");
  assert.equal(parseRange("bytes=5000-6000", size), "unsatisfiable");
  assert.equal(parseRange("bytes=-0", size), "unsatisfiable");

  // Multi-range is not supported; treat as no range rather than mis-slicing.
  assert.equal(parseRange("bytes=0-99,200-299", size), null);
  assert.equal(parseRange("items=0-99", size), null);
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
