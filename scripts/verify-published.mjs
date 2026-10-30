/**
 * Fetches the published bundle the way an installed app would, and checks it.
 *
 * "firebase deploy exited zero" is not the same as "an operator can install
 * this". The failure that matters is silent: a missing file, a manifest that
 * does not match what was uploaded, or a signature the shipped public key
 * rejects. Each leaves the channel looking fine and quietly unusable.
 *
 *   node scripts/verify-published.mjs
 *   APOSTELLO_UPDATE_URL=http://127.0.0.1:8099 node scripts/verify-published.mjs
 */
import { createHash, createPublicKey, verify } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL =
  process.env.APOSTELLO_UPDATE_URL || "https://apostello-updates.web.app";

// Read from the shell source rather than hardcoding: this must be the key
// installed apps actually carry, or the check proves nothing about them.
const src = await readFile(
  path.join(import.meta.dirname, "..", "electron", "update.js"),
  "utf8"
);
const PUBLIC_KEY = src.match(/const PUBLIC_KEY = "([^"]*)";/)?.[1];
if (!PUBLIC_KEY) {
  throw new Error("Could not read PUBLIC_KEY from electron/update.js");
}

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
};

const manifestRes = await fetch(`${BASE_URL}/update.json`, { cache: "no-store" });
const sigRes = await fetch(`${BASE_URL}/update.sig`, { cache: "no-store" });
if (!manifestRes.ok || !sigRes.ok) {
  fail(`${BASE_URL}/update.json → ${manifestRes.status}, update.sig → ${sigRes.status}`);
  process.exit(1);
}

const bytes = Buffer.from(await manifestRes.arrayBuffer());
const signature = (await sigRes.text()).trim();

// Before parsing, exactly as the app does: a tampered manifest must never
// reach JSON.parse.
const signed = verify(
  null,
  bytes,
  createPublicKey({
    key: Buffer.from(PUBLIC_KEY, "base64"),
    format: "der",
    type: "spki",
  }),
  Buffer.from(signature, "base64")
);
if (!signed) {
  fail("signature does not verify against the key in electron/update.js");
  process.exit(1);
}
console.log("✓ signature verifies against the shipped public key");

const manifest = JSON.parse(bytes.toString("utf8"));
console.log(
  `✓ manifest: v${manifest.version}, minShell ${manifest.minShell}, ` +
    `${Object.keys(manifest.files).length} files`
);

// Every file, hashed. Hosting answers a missing path with the SPA rewrite on
// a site that has one — 200 and index.html — so only the hash distinguishes
// "deployed" from "never uploaded".
let bad = 0;
for (const [rel, expected] of Object.entries(manifest.files)) {
  const res = await fetch(`${BASE_URL}/${rel}`, { cache: "no-store" });
  if (!res.ok) {
    fail(`${rel} → HTTP ${res.status}`);
    bad++;
    continue;
  }
  const got = createHash("sha256")
    .update(Buffer.from(await res.arrayBuffer()))
    .digest("hex");
  if (got !== expected) {
    fail(`${rel} → hash mismatch`);
    bad++;
  }
}

if (bad) {
  fail(`${bad} of ${Object.keys(manifest.files).length} files are wrong`);
  process.exit(1);
}
console.log(`✓ all ${Object.keys(manifest.files).length} files match the manifest`);
