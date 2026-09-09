const { app, safeStorage } = require("electron");
const { readFile, writeFile, unlink } = require("node:fs/promises");
const path = require("node:path");

// The operator account this machine signs in as. Kept out of data.json because
// that file is plain JSON the user can open, and this one holds a password:
// safeStorage encrypts it with the OS keystore (DPAPI on Windows), so it is
// not readable by another account or by someone reading the disk offline.
//
// ponytail: that is the ceiling — code running as this same user can still
// decrypt it. Per-machine accounts are what bound the damage: revoke the one
// operator in the Firebase console and only this machine loses access.

let cached;

function credentialsFile() {
  if (!cached) {
    cached =
      process.env.APOSTELLO_CREDENTIALS_FILE ||
      path.join(app.getPath("userData"), "operator.bin");
  }
  return cached;
}

async function load() {
  let raw;
  try {
    raw = await readFile(credentialsFile());
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }

  // A machine that cannot decrypt (keystore unavailable, or the file was
  // copied from another machine) is treated as "not configured" rather than
  // failing startup — Settings can just save it again.
  if (!safeStorage.isEncryptionAvailable()) return null;
  try {
    return JSON.parse(safeStorage.decryptString(raw));
  } catch {
    return null;
  }
}

async function save(credentials) {
  if (!credentials?.email || !credentials?.password) {
    await unlink(credentialsFile()).catch(() => {});
    return;
  }
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("OS credential encryption is unavailable on this machine");
  }
  const blob = safeStorage.encryptString(
    JSON.stringify({ email: credentials.email, password: credentials.password })
  );
  await writeFile(credentialsFile(), blob);
}

module.exports = { load, save, credentialsFile };
