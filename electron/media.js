const { app } = require("electron");
const { readdir, mkdir, writeFile, unlink, stat } = require("node:fs/promises");
const path = require("node:path");

const { resolveWithin } = require("./server");

// Assets live in a folder on disk, keyed by the same root-relative paths that
// were Storage object paths (general/…, themes/…). Keeping that shape means
// every storagePath already written into a program schedule resolves unchanged
// after the migration — only the root moves.
const MEDIA_EXT =
  /\.(jpe?g|png|gif|webp|svg|bmp|avif|mp4|webm|mov|m4v|ogv|mp3|wav|m4a|aac|flac|oga|ogg|opus|wma|pptx)$/i;

let cachedRoot;

function mediaRoot() {
  if (!cachedRoot) {
    cachedRoot =
      process.env.APOSTELLO_MEDIA_ROOT ||
      path.join(app.getPath("userData"), "media");
  }
  return cachedRoot;
}

// Never trust a path from the renderer, even though it is our own code — the
// window also loads remote content.
function safePath(storagePath) {
  const resolved = resolveWithin(mediaRoot(), `/${String(storagePath || "")}`);
  if (!resolved) throw new Error(`Refusing path outside media root: ${storagePath}`);
  return resolved;
}

/** Files in general/, the library the media browser shows. */
async function list() {
  const dir = path.join(mediaRoot(), "general");
  let names;
  try {
    names = await readdir(dir);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }

  const items = [];
  for (const name of names) {
    if (!MEDIA_EXT.test(name)) continue;
    const info = await stat(path.join(dir, name)).catch(() => null);
    if (!info?.isFile()) continue;
    items.push({
      storagePath: `general/${name}`,
      fileName: name,
      size: info.size,
    });
  }
  return items;
}

async function save(storagePath, bytes) {
  const target = safePath(storagePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(bytes));
  return storagePath;
}

async function remove(storagePath) {
  const target = safePath(storagePath);
  await unlink(target).catch((err) => {
    if (err.code !== "ENOENT") throw err;
  });
}

async function exists(storagePath) {
  const info = await stat(safePath(storagePath)).catch(() => null);
  return Boolean(info?.isFile());
}

module.exports = { mediaRoot, list, save, remove, exists };
