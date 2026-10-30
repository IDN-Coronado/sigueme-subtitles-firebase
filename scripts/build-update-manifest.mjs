/**
 * Writes dist/update.json + dist/update.sig after a build.
 *
 * The desktop app serves its renderer from a folder (electron/server.js), so a
 * new bundle can be dropped in without reinstalling. The manifest is what makes
 * that safe: it pins a sha256 per file, and the signature pins the manifest.
 *
 * Usage:
 *   node scripts/build-update-manifest.mjs            # after `vite build`
 *   node scripts/build-update-manifest.mjs --keygen   # one time, prints a key pair
 *
 * APOSTELLO_UPDATE_KEY holds the base64 PKCS8 private key. It never belongs in
 * the repo or in the installer — only on the machine that cuts releases.
 */
import { createHash, createPrivateKey, generateKeyPairSync, sign } from "node:crypto";
import { execSync } from "node:child_process";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DIST = path.join(import.meta.dirname, "..", "dist");
// Written by this script, so never listed inside the manifest itself.
//
// Deliberately not manifest.json: public/manifest.json is the PWA manifest
// that index.html links, and writing over it would both break the web build
// and drop it from the file list, so no bundle would ever restore it.
const EXCLUDE = new Set(["update.json", "update.sig"]);

if (process.argv.includes("--keygen")) {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  console.log(
    "APOSTELLO_UPDATE_KEY (private — release machine only, never commit):\n" +
      privateKey.export({ type: "pkcs8", format: "der" }).toString("base64") +
      "\n\nPUBLIC_KEY (paste into electron/update.js):\n" +
      publicKey.export({ type: "spki", format: "der" }).toString("base64")
  );
  process.exit(0);
}

// Must match BASE_URL in electron/update.js — this is the host the guard
// below reads the live manifest from, and installed apps read the same one.
const BASE_URL =
  process.env.APOSTELLO_UPDATE_URL || "https://apostello-updates.web.app";

// Same semantics as compareVersions in electron/update.js, duplicated rather
// than imported: that module is CJS and requires("electron") at load, so it
// cannot be pulled into a plain node script. Keep the two in step.
function isNewer(a, b) {
  const x = String(a).split(".").map(Number);
  const y = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return d > 0;
  }
  return false;
}

/**
 * Publishing a version that is not newer than the live one is silent: every
 * installed app compares the manifest against what it already has, decides
 * nothing is newer, and reports "up to date" forever. The bundle is live but
 * unreachable. This is the check that would have caught shipping two
 * different 3.0.2 bundles.
 */
async function refuseIfNotNewer(version) {
  const res = await fetch(`${BASE_URL}/update.json`, { cache: "no-store" }).catch(
    () => null
  );
  // No manifest yet (first publish) or the site is unreachable — the deploy
  // that follows will fail on its own if the latter.
  if (!res?.ok) return;

  let live;
  try {
    live = JSON.parse(await res.text());
  } catch {
    return; // Not JSON: the SPA rewrite answering for a missing file.
  }
  if (!live?.version || isNewer(version, live.version)) return;

  if (process.env.APOSTELLO_ALLOW_REPUBLISH === "1") {
    console.warn(
      `! Republishing ${version} over the live ${live.version}; installed ` +
        "apps will not fetch it (APOSTELLO_ALLOW_REPUBLISH=1)."
    );
    return;
  }
  throw new Error(
    `Refusing to publish ${version}: ${BASE_URL} already serves ${live.version}, ` +
      "so no installed app would fetch this bundle. Run `npm version patch` first.\n" +
      "Set APOSTELLO_ALLOW_REPUBLISH=1 only if you mean to overwrite the files " +
      "without anyone picking them up."
  );
}

/**
 * The renderer reaches the shell only through preload, so a bundle that calls
 * a method added there needs minShell raised to the shell that introduced it.
 * Warn rather than fail: most shell changes are internal and need no bump,
 * and failing on all of them would train you to ignore it.
 */
function warnIfMinShellLooksStale(pkgJson) {
  let lastTag;
  try {
    lastTag = execSync("git describe --tags --abbrev=0", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return; // No tags yet.
  }

  let changed = "";
  try {
    changed = execSync(`git diff --name-only ${lastTag}..HEAD -- electron/preload.js`, {
      stdio: ["ignore", "pipe", "ignore"],
    }).toString();
  } catch {
    return;
  }
  if (!changed.trim()) return;

  let taggedMinShell;
  try {
    const at = JSON.parse(
      execSync(`git show ${lastTag}:package.json`, {
        stdio: ["ignore", "pipe", "ignore"],
      }).toString()
    );
    taggedMinShell = at.apostello?.minShell;
  } catch {
    return;
  }

  const now = pkgJson.apostello?.minShell;
  if (now && taggedMinShell && now !== taggedMinShell) return;

  console.warn(
    `! electron/preload.js changed since ${lastTag} but minShell is still ${now}.\n` +
      "  If this bundle calls anything new on window.desktop, raise minShell to\n" +
      "  the shell version that added it — an older shell would otherwise accept\n" +
      "  the bundle and fail at the call. Ignore this if the change was internal."
  );
}

const keyB64 = process.env.APOSTELLO_UPDATE_KEY;
if (!keyB64) {
  // Failing here is the point: an unsigned manifest would be rejected by every
  // installed app anyway, and shipping one silently breaks the update channel.
  throw new Error(
    "APOSTELLO_UPDATE_KEY is not set — run `node scripts/build-update-manifest.mjs --keygen` once, " +
      "then keep the private key on the release machine."
  );
}

const pkg = JSON.parse(
  await readFile(path.join(import.meta.dirname, "..", "package.json"), "utf8")
);

await refuseIfNotNewer(pkg.version);
warnIfMinShellLooksStale(pkg);

const entries = await readdir(DIST, { recursive: true, withFileTypes: true });
const files = {};
for (const entry of entries) {
  if (!entry.isFile()) continue;
  const full = path.join(entry.parentPath, entry.name);
  // Forward slashes: these are URL paths on Hosting, not local paths.
  const rel = path.relative(DIST, full).split(path.sep).join("/");
  if (EXCLUDE.has(rel)) continue;
  files[rel] = createHash("sha256").update(await readFile(full)).digest("hex");
}

if (!files["index.html"]) {
  throw new Error("dist/index.html is missing — run `vite build` first.");
}

const manifest = JSON.stringify(
  {
    version: pkg.version,
    // Bump this in package.json whenever the renderer starts depending on a
    // preload method or IPC channel an older installed shell does not have.
    minShell: pkg.apostello?.minShell || pkg.version,
    files,
  },
  null,
  2
);

// Signed over the exact bytes that get written, so verification needs no
// canonical-JSON rules — the app hashes the file it downloaded, as-is.
const bytes = Buffer.from(manifest, "utf8");
const signature = sign(
  null,
  bytes,
  createPrivateKey({
    key: Buffer.from(keyB64, "base64"),
    format: "der",
    type: "pkcs8",
  })
);

await writeFile(path.join(DIST, "update.json"), bytes);
await writeFile(path.join(DIST, "update.sig"), signature.toString("base64"));

console.log(
  `update.json: v${pkg.version} (minShell ${JSON.parse(manifest).minShell}), ` +
    `${Object.keys(files).length} files, signed.`
);
