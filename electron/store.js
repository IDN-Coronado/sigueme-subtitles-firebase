const { app } = require("electron");
const { readFile, writeFile, rename } = require("node:fs/promises");
const path = require("node:path");

// One JSON file holding programs, songs, themes and media. Not SQLite: the app
// has no queries — every hook loads a whole collection and filters in JS — and
// the data is document-shaped, so a table would degrade to (id, json_blob).
// ponytail: full rewrite per save. ~200 KB at 100 songs, so ~1ms. Split
// songs.json out if the library ever reaches a few thousand entries.

let cached;

function dataFile() {
  if (!cached) {
    cached =
      process.env.APOSTELLO_DATA_FILE ||
      path.join(app.getPath("userData"), "data.json");
  }
  return cached;
}

async function load() {
  let raw;
  try {
    raw = await readFile(dataFile(), "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
  // A parse error is deliberately not swallowed into {}: an empty result reads
  // as "no data yet" and would invite a re-import that overwrites the only
  // copy of the song library, taking the .bak with it.
  return JSON.parse(raw);
}

async function writeAtomic(data) {
  const target = dataFile();
  const tmp = `${target}.tmp`;
  await writeFile(tmp, JSON.stringify(data));
  await rename(target, `${target}.bak`).catch(() => {});
  await rename(tmp, target);
}

// Saves are serialized: two overlapping calls would otherwise race on the same
// .tmp path and could rename a half-written file over the real one.
let queue = Promise.resolve();

function save(data) {
  queue = queue.then(
    () => writeAtomic(data),
    () => writeAtomic(data)
  );
  return queue;
}

module.exports = { load, save, dataFile };
