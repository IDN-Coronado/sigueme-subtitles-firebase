const { createServer } = require("node:http");
const { createReadStream } = require("node:fs");
const { stat } = require("node:fs/promises");
const path = require("node:path");

// Serving over http://127.0.0.1 rather than file:// or a custom scheme is
// deliberate: createBrowserRouter needs real paths, Firebase Auth treats
// localhost as an authorized domain, and both windows (console + live view)
// must share an origin for BroadcastChannel to work between them.

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
};

async function isFile(target) {
  try {
    return (await stat(target)).isFile();
  } catch {
    return false;
  }
}

/**
 * Maps a request pathname to a file under `root`. Anything that isn't a real
 * file inside root — including traversal attempts — falls back to index.html,
 * mirroring the firebase.json "**" -> "/index.html" rewrite that lets a direct
 * navigation to /live or /program/:id boot the client-side router.
 */
async function resolveRequestPath(root, pathname) {
  const index = path.join(root, "index.html");
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return index;
  }

  const resolved = path.resolve(root, `.${path.posix.normalize(decoded)}`);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return index;

  return (await isFile(resolved)) ? resolved : index;
}

function startAppServer(root, port) {
  const server = createServer(async (req, res) => {
    const { pathname } = new URL(req.url, "http://127.0.0.1");
    const file = await resolveRequestPath(root, pathname);
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file)] || "application/octet-stream",
    });
    createReadStream(file).pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

module.exports = { startAppServer, resolveRequestPath };
