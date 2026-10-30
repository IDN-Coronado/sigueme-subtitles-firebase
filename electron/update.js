const { app } = require("electron");
const { createHash, createPublicKey, verify } = require("node:crypto");
const { mkdir, readdir, readFile, rename, rm, stat, writeFile } =
  require("node:fs/promises");
const path = require("node:path");

const { resolveWithin } = require("./server");

// The renderer is served from a folder (electron/server.js), not from inside
// app.asar, so a new dist/ can replace it without an installer. That covers
// everything in src/ — HTML, CSS, JS — but nothing in electron/: a change to
// main, preload or server still ships as a build. `minShell` is what keeps a
// new bundle from booting on a shell that is too old for it.
//
// Updates come from the same Firebase Hosting site the web build already
// deploys to (firebase.json, target "apostello"), so there is no release
// server. Hosting rewrites unknown paths to index.html with a 200, which is
// exactly why every file carries a sha256 and the manifest carries a
// signature — "it downloaded fine" proves nothing here.
//
// Its own Hosting site, not the website's: a Hosting deploy replaces a whole
// site, so while these shared apostello.web.app each publish wiped the other.
// That site also has no SPA rewrite, so a file that was never deployed now
// answers a real 404 instead of 200 with index.html.
//
// Compiled in, so changing it needs a new installer — an old shell keeps
// asking the old host.
const BASE_URL =
  process.env.APOSTELLO_UPDATE_URL || "https://apostello-updates.web.app";

// Ed25519 SPKI, base64 — the public half of the release key. Its private half
// lives only on the machine that cuts releases, in APOSTELLO_UPDATE_KEY.
//
// This, not TLS, is the trust boundary: anyone who can write to the Hosting
// site can serve a bundle, and the renderer runs it with the preload bridge in
// reach. Verifying the manifest against this key means a compromised Hosting
// account still cannot push code. Replacing the key needs a new installer, so
// losing the private half costs a release — leaking it costs everything.
const PUBLIC_KEY = "MCowBQYDK2VwAyEA5mkuZnX32H6JOEexX6YPdewQw0x+GJOmP7QXlfu2qCE=";

// A bundle that cannot mount React never calls update:ready. Twenty seconds is
// well past a cold start on the kind of machine this runs on, and the cost of
// guessing low is one needless rollback — against bricking an install the
// morning of a service.
const WATCHDOG_MS = 20000;

let cachedRoot;
let watchdog = null;

function bundlesRoot() {
  if (!cachedRoot) {
    cachedRoot =
      process.env.APOSTELLO_BUNDLE_ROOT ||
      path.join(app.getPath("userData"), "bundles");
  }
  return cachedRoot;
}

const statePath = () => path.join(bundlesRoot(), "state.json");

async function readState() {
  try {
    return JSON.parse(await readFile(statePath(), "utf8"));
  } catch {
    // Missing or unreadable state means "no bundle installed", which falls
    // back to the one inside app.asar — always a valid answer.
    return {};
  }
}

async function writeState(state) {
  await mkdir(bundlesRoot(), { recursive: true });
  await writeFile(statePath(), JSON.stringify(state));
}

async function isFile(target) {
  try {
    return (await stat(target)).isFile();
  } catch {
    return false;
  }
}

/** Numeric compare of dotted versions. -1, 0 or 1. */
function compareVersions(a, b) {
  const left = String(a || "0").split(".").map(Number);
  const right = String(b || "0").split(".").map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const l = left[i] || 0;
    const r = right[i] || 0;
    if (l !== r) return l < r ? -1 : 1;
  }
  return 0;
}

/**
 * Ed25519 over the raw manifest bytes. Verified before the JSON is parsed:
 * Hosting answers a missing path with index.html and a 200, so an unsigned
 * body is the normal failure here, not an exotic one.
 */
function verifyManifest(bytes, signatureB64, publicKeyB64 = PUBLIC_KEY) {
  if (!publicKeyB64) return false;
  try {
    return verify(
      null,
      bytes,
      createPublicKey({
        key: Buffer.from(publicKeyB64, "base64"),
        format: "der",
        type: "spki",
      }),
      Buffer.from(signatureB64, "base64")
    );
  } catch {
    return false;
  }
}

/**
 * The folder electron/server.js should serve, and whether it is still
 * unproven. `fallbackDir` is the bundle shipped inside app.asar.
 */
async function activeBundle(fallbackDir, shellVersion) {
  const state = await readState();
  // `version: null` means the bundle inside app.asar, whose version is the
  // shell's own — Settings shows the shell version in that case.
  if (!state.version) return { dir: fallbackDir, pending: false, version: null };

  // A bundle staged before an installer upgrade can be older than the one
  // that installer shipped, and nothing else would ever notice: the update
  // check compares the published version against this stale state, finds it
  // not newer, and reports "up to date" forever. Installing is a deliberate
  // act by an operator, so the shipped bundle wins. It is never a downgrade —
  // the shipped bundle is the shell's own version by definition.
  if (compareVersions(state.version, shellVersion) <= 0) {
    console.log(
      `Discarding staged bundle ${state.version}; this app ships ` +
        `${shellVersion}.`
    );
    // `failed` outlives the discard: it names a version that did not boot
    // here, and re-downloading it on the next check would just repeat that.
    const kept = state.failed ? { failed: state.failed } : {};
    await writeState(kept);
    await prune(kept);
    return { dir: fallbackDir, pending: false, version: null };
  }

  const dir = path.join(bundlesRoot(), state.version);
  if (!(await isFile(path.join(dir, "index.html")))) {
    // Deleted by hand, or lost to a disk repair. Serving the empty folder
    // would answer every route with nothing at all.
    await writeState({});
    return { dir: fallbackDir, pending: false, version: null };
  }
  return { dir, pending: state.pending === true, version: state.version };
}

/** Starts the rollback timer for a bundle booting for the first time. */
function armRollback() {
  watchdog = setTimeout(() => {
    console.warn("New bundle never signalled ready; rolling back.");
    rollback().catch((err) => console.error("Rollback failed", err));
  }, WATCHDOG_MS);
}

/** Called over IPC once the renderer has actually mounted. */
async function confirmHealthy() {
  if (watchdog) {
    clearTimeout(watchdog);
    watchdog = null;
  }
  const state = await readState();
  if (!state.pending) return;
  delete state.pending;
  await writeState(state);
  await prune(state);
}

async function rollback() {
  const state = await readState();
  const broken = state.version;
  // `failed` is what stops the loop: without it the next launch sees the same
  // published version, finds it newer than the one we rolled back to, and
  // downloads the same broken bundle again, forever. Carried until a
  // different version installs, which replaces this state wholesale.
  await writeState(
    state.previous
      ? { version: state.previous, failed: broken }
      : { failed: broken }
  );
  if (broken) {
    await rm(path.join(bundlesRoot(), broken), { recursive: true, force: true });
  }
  app.relaunch();
  app.quit();
}

/** Keeps the live bundle and the one to roll back to; drops the rest. */
async function prune(state) {
  const keep = new Set([state.version, state.previous].filter(Boolean));
  const entries = await readdir(bundlesRoot(), { withFileTypes: true }).catch(
    () => []
  );
  for (const entry of entries) {
    if (!entry.isDirectory() || keep.has(entry.name)) continue;
    await rm(path.join(bundlesRoot(), entry.name), {
      recursive: true,
      force: true,
    }).catch(() => {});
  }
}

/**
 * Returns the bytes of a file already on disk in `fromDir` whose contents hash
 * to `expected`, or null.
 *
 * Vite fingerprints its output, so the chunks that did not change keep their
 * names and hashes. The vendor chunks here are ~20 MB against ~1.7 MB of app
 * code: without this, every typo fix is a 20 MB download over church wifi.
 */
async function reuseLocal(fromDir, rel, expected) {
  if (!fromDir) return null;
  const candidate = resolveWithin(fromDir, `/${rel}`);
  if (!candidate) return null;
  const body = await readFile(candidate).catch(() => null);
  if (!body) return null;
  const digest = createHash("sha256").update(body).digest("hex");
  return digest === expected ? body : null;
}

/**
 * Builds the new bundle in a temp folder and only swaps it into place once
 * every file matches the manifest — a half-applied bundle is unbootable.
 */
async function install(manifest, previousDir) {
  const root = bundlesRoot();
  const tmp = path.join(root, `.tmp-${manifest.version}`);
  const target = path.join(root, manifest.version);

  await rm(tmp, { recursive: true, force: true });
  try {
    for (const [rel, expected] of Object.entries(manifest.files)) {
      const file = resolveWithin(tmp, `/${rel}`);
      if (!file) throw new Error(`Manifest path escapes the bundle: ${rel}`);

      let body = await reuseLocal(previousDir, rel, expected);
      if (!body) {
        const res = await fetch(`${BASE_URL}/${rel}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`${rel}: HTTP ${res.status}`);

        body = Buffer.from(await res.arrayBuffer());
        const digest = createHash("sha256").update(body).digest("hex");
        // Hosting rewrites an unknown path to index.html with a 200, so this
        // is how a file that was never deployed actually shows up.
        if (digest !== expected) throw new Error(`${rel}: hash mismatch`);
      }

      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, body);
    }

    await rm(target, { recursive: true, force: true });
    await rename(tmp, target);
  } catch (err) {
    await rm(tmp, { recursive: true, force: true }).catch(() => {});
    throw err;
  }
}

/**
 * Why a published manifest should be left alone, or null to install it. Kept
 * pure and separate from checkForUpdate because the decision is the part with
 * the edge cases, and testing it there would mean a network round trip and
 * the real signing key.
 */
function installBlockedBecause(manifest, state, shellVersion) {
  if (manifest.version === state.failed) return "failed";
  const installed = state.version || shellVersion;
  if (compareVersions(manifest.version, installed) <= 0) return "old";
  if (compareVersions(manifest.minShell, shellVersion) > 0) return "shell";
  return null;
}

/**
 * Fetches the published manifest and installs it if it is newer. Applied on
 * the next launch: swapping the folder under a running window would only take
 * effect on reload anyway, and mid-service is the wrong moment for either.
 *
 * `servingDir` is the bundle currently on screen; its unchanged files are
 * reused instead of re-downloaded.
 *
 * Resolves to { status, version?, minShell? }. The boot check only cares
 * whether something was staged, but the Settings button reports the outcome
 * to an operator, and "nothing happened" has four different meanings:
 *
 *   staged      a new bundle is downloaded and applies on restart
 *   current     the published bundle is not newer than what is installed
 *   failed      it was staged before, did not boot, and is deliberately
 *               skipped until a different version is published
 *   shell       the bundle needs a newer Electron shell than this installer
 *   offline     the manifest could not be fetched
 *   disabled    no signing key compiled in
 */
async function checkForUpdate(servingDir) {
  if (!PUBLIC_KEY) {
    console.warn(
      "Updates are off: PUBLIC_KEY is unset in electron/update.js " +
        "(see scripts/build-update-manifest.mjs --keygen)."
    );
    return { status: "disabled" };
  }

  const [manifestRes, signatureRes] = await Promise.all([
    fetch(`${BASE_URL}/update.json`, { cache: "no-store" }),
    fetch(`${BASE_URL}/update.sig`, { cache: "no-store" }),
  ]);
  if (!manifestRes.ok || !signatureRes.ok) return { status: "offline" };

  const bytes = Buffer.from(await manifestRes.arrayBuffer());
  const signature = (await signatureRes.text()).trim();
  if (!verifyManifest(bytes, signature)) {
    throw new Error("Update manifest failed signature verification; ignored.");
  }

  const manifest = JSON.parse(bytes.toString("utf8"));
  const state = await readState();

  const blocked = installBlockedBecause(manifest, state, app.getVersion());
  if (blocked === "failed") {
    console.warn(
      `Bundle ${manifest.version} failed to boot here and was rolled back; ` +
        "skipping it until a different version is published."
    );
    return { status: "failed", version: manifest.version };
  }
  if (blocked === "shell") {
    console.warn(
      `Bundle ${manifest.version} needs app ${manifest.minShell} or newer; ` +
        `this is ${app.getVersion()}. Install the new build to get it.`
    );
    return {
      status: "shell",
      version: manifest.version,
      minShell: manifest.minShell,
    };
  }
  if (blocked) return { status: "current", version: manifest.version };

  await install(manifest, servingDir);
  await writeState({
    version: manifest.version,
    previous: state.version || null,
    pending: true,
  });
  return { status: "staged", version: manifest.version };
}

// The boot check and the Settings button can overlap — the first fires seconds
// after launch, which is exactly when someone opens Settings and clicks. Both
// would install into the same .tmp-<version>, and one could rm the target
// while the other renames onto it. Same approach as store.js: a second caller
// joins the running check instead of starting a download of its own.
let inFlight = null;

function checkForUpdateOnce(servingDir) {
  if (!inFlight) {
    inFlight = checkForUpdate(servingDir).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

module.exports = {
  activeBundle,
  armRollback,
  checkForUpdate,
  checkForUpdateOnce,
  compareVersions,
  confirmHealthy,
  installBlockedBecause,
  verifyManifest,
  bundlesRoot,
};
