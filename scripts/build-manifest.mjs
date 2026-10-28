/**
 * Writes dist/manifest.json + dist/manifest.sig after a build.
 *
 * The desktop app serves its renderer from a folder (electron/server.js), so a
 * new bundle can be dropped in without reinstalling. The manifest is what makes
 * that safe: it pins a sha256 per file, and the signature pins the manifest.
 *
 * Usage:
 *   node scripts/build-manifest.mjs            # after `vite build`
 *   node scripts/build-manifest.mjs --keygen   # one time, prints a key pair
 *
 * APOSTELLO_UPDATE_KEY holds the base64 PKCS8 private key. It never belongs in
 * the repo or in the installer — only on the machine that cuts releases.
 */
import { createHash, createPrivateKey, generateKeyPairSync, sign } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DIST = path.join(import.meta.dirname, "..", "dist");
// Written by this script, so never listed inside the manifest itself.
const EXCLUDE = new Set(["manifest.json", "manifest.sig"]);

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

const keyB64 = process.env.APOSTELLO_UPDATE_KEY;
if (!keyB64) {
  // Failing here is the point: an unsigned manifest would be rejected by every
  // installed app anyway, and shipping one silently breaks the update channel.
  throw new Error(
    "APOSTELLO_UPDATE_KEY is not set — run `node scripts/build-manifest.mjs --keygen` once, " +
      "then keep the private key on the release machine."
  );
}

const pkg = JSON.parse(
  await readFile(path.join(import.meta.dirname, "..", "package.json"), "utf8")
);

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

await writeFile(path.join(DIST, "manifest.json"), bytes);
await writeFile(path.join(DIST, "manifest.sig"), signature.toString("base64"));

console.log(
  `manifest.json: v${pkg.version} (minShell ${JSON.parse(manifest).minShell}), ` +
    `${Object.keys(files).length} files, signed.`
);
