const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { generateKeyPairSync, sign } = require("node:crypto");

const fs = require("node:fs/promises");
const os = require("node:os");

process.env.APOSTELLO_DATA_FILE = path.join(
  os.tmpdir(),
  `apostello-test-${process.pid}.json`
);
process.env.APOSTELLO_BUNDLE_ROOT = path.join(
  os.tmpdir(),
  `apostello-bundles-${process.pid}`
);
process.env.APOSTELLO_CREDENTIALS_FILE = path.join(
  os.tmpdir(),
  `apostello-test-${process.pid}.bin`
);

const { resolveRequestPath, resolveWithin, parseRange } = require("./server");
const { pickDisplay } = require("./liveWindow");
const store = require("./store");
const update = require("./update");
const credentials = require("./credentials");

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

test("update: version compare decides what counts as newer", () => {
  assert.equal(update.compareVersions("3.0.1", "3.0.0"), 1);
  assert.equal(update.compareVersions("3.0.0", "3.0.1"), -1);
  assert.equal(update.compareVersions("3.0.0", "3.0.0"), 0);
  // Not string order: "3.0.10" > "3.0.9" and "3.10.0" > "3.9.0".
  assert.equal(update.compareVersions("3.0.10", "3.0.9"), 1);
  assert.equal(update.compareVersions("3.10.0", "3.9.0"), 1);
  // Short forms pad with zeros rather than comparing undefined.
  assert.equal(update.compareVersions("3.1", "3.1.0"), 0);
  assert.equal(update.compareVersions("4", "3.9.9"), 1);
});

test("update: only a correctly signed manifest is accepted", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const pub = publicKey.export({ type: "spki", format: "der" }).toString("base64");

  const manifest = Buffer.from(
    JSON.stringify({ version: "3.0.1", minShell: "3.0.0", files: {} })
  );
  const signature = sign(null, manifest, privateKey).toString("base64");

  assert.equal(update.verifyManifest(manifest, signature, pub), true);

  // The reason this exists: swapping the bundle is arbitrary code execution,
  // so every one of these must fail closed rather than throw or pass.
  const tampered = Buffer.from(
    JSON.stringify({ version: "9.9.9", minShell: "3.0.0", files: {} })
  );
  assert.equal(update.verifyManifest(tampered, signature, pub), false);

  const other = generateKeyPairSync("ed25519");
  assert.equal(
    update.verifyManifest(manifest, sign(null, manifest, other.privateKey).toString("base64"), pub),
    false,
    "signed by the wrong key"
  );

  // Hosting answers a missing /manifest.json with index.html and a 200, so an
  // HTML body with no signature is the everyday failure, not an exotic one.
  assert.equal(
    update.verifyManifest(Buffer.from("<!doctype html>"), "", pub),
    false
  );
  assert.equal(update.verifyManifest(manifest, "not base64 at all", pub), false);
  assert.equal(
    update.verifyManifest(manifest, signature, ""),
    false,
    "no public key configured = updates off"
  );
});

test("update: a staged bundle missing its index falls back to the shipped one", async (t) => {
  const root = process.env.APOSTELLO_BUNDLE_ROOT;
  const shipped = path.join(__dirname, "..", "dist");
  t.after(() => fs.rm(root, { recursive: true, force: true }));

  await fs.rm(root, { recursive: true, force: true });
  assert.deepEqual(await update.activeBundle(shipped), {
    dir: shipped,
    pending: false,
    version: null,
  });

  // State pointing at a folder that is no longer there: serving it would
  // answer every route with nothing at all.
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(
    path.join(root, "state.json"),
    JSON.stringify({ version: "3.0.1", pending: true })
  );
  assert.deepEqual(await update.activeBundle(shipped), {
    dir: shipped,
    pending: false,
    version: null,
  });
  assert.deepEqual(
    JSON.parse(await fs.readFile(path.join(root, "state.json"), "utf8")),
    {},
    "the dangling pointer is cleared, not retried every launch"
  );

  // A real bundle is served, and reports that it still has to prove itself.
  await fs.mkdir(path.join(root, "3.0.2"), { recursive: true });
  await fs.writeFile(path.join(root, "3.0.2", "index.html"), "<!doctype html>");
  await fs.writeFile(
    path.join(root, "state.json"),
    JSON.stringify({ version: "3.0.2", pending: true })
  );
  assert.deepEqual(await update.activeBundle(shipped), {
    dir: path.join(root, "3.0.2"),
    pending: true,
    version: "3.0.2",
  });
});

test("credentials: absent file reads as null, saving nothing clears it", async () => {
  // safeStorage needs a real Electron runtime, so the encrypt/decrypt roundtrip
  // is not covered here — only the paths that decide whether this machine is
  // configured at all, which is what startup sign-in branches on.
  // ponytail: promote to a spectron/electron-mocha run if the crypto path regresses.
  const file = credentials.credentialsFile();
  const exists = () => fs.access(file).then(() => true, () => false);

  await fs.rm(file, { force: true });
  assert.equal(await credentials.load(), null, "no file reads as not configured");

  await fs.writeFile(file, "whatever");
  await credentials.save(null);
  assert.equal(await exists(), false, "clearing removes the stored account");

  await fs.writeFile(file, "whatever");
  await credentials.save({ email: "a@b.c" });
  assert.equal(await exists(), false, "a half-filled form clears rather than stores");
});

test("update: a bundle that failed to boot is not downloaded again", () => {
  const blocked = (manifest, state, shell = "3.0.1") =>
    update.installBlockedBecause(manifest, state, shell);
  const m = (version, minShell = "3.0.0") => ({ version, minShell });

  // The loop this exists to stop: rollback leaves the app on 3.0.2, so 3.0.3
  // still looks newer and would be fetched, booted and rolled back forever.
  assert.equal(
    blocked(m("3.0.3"), { version: "3.0.2", failed: "3.0.3" }),
    "failed"
  );
  // Rollback with nothing to fall back to: the shell version is the floor,
  // and the broken bundle is still newer than it.
  assert.equal(blocked(m("3.0.3"), { failed: "3.0.3" }), "failed");

  // Publishing a fix gets through — the block is per version, not a latch.
  assert.equal(blocked(m("3.0.4"), { version: "3.0.2", failed: "3.0.3" }), null);

  // The other two reasons still work, and a clean state still installs.
  assert.equal(blocked(m("3.0.2"), { version: "3.0.2" }), "old");
  assert.equal(blocked(m("3.0.1"), {}), "old", "not newer than the shell");
  assert.equal(blocked(m("4.0.0", "4.0.0"), {}), "shell");
  assert.equal(blocked(m("3.0.2"), {}), null);
});

test("update: overlapping checks share one run", async () => {
  // The boot check fires seconds after launch, which is exactly when someone
  // opens Settings and clicks. Two installs would race on .tmp-<version> and
  // one could rm the target while the other renames onto it.
  const realFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    await new Promise((r) => setTimeout(r, 20));
    return { ok: false };
  };
  try {
    const [a, b] = await Promise.all([
      update.checkForUpdateOnce("ignored"),
      update.checkForUpdateOnce("ignored"),
    ]);
    assert.equal(a, b, "both callers get the same promise result");
    assert.equal(calls, 2, "one run fetches the manifest and signature, not four");

    // Once settled the guard clears, so a later click checks again.
    await update.checkForUpdateOnce("ignored");
    assert.equal(calls, 4, "a later check is not swallowed by the finished one");
  } finally {
    globalThis.fetch = realFetch;
  }
});
