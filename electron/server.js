const { createServer } = require("node:http");
const { createReadStream } = require("node:fs");
const { stat } = require("node:fs/promises");
const path = require("node:path");

// Serving over http://127.0.0.1 rather than file:// or a custom scheme is
// deliberate: createBrowserRouter needs real paths, Firebase Auth treats
// localhost as an authorized domain, and both windows (console + live view)
// must share an origin for BroadcastChannel to work between them.

const MEDIA_PREFIX = "/media/";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  // pdf.js ships its worker as .mjs; a worker script is refused unless it is
  // served with a JavaScript type.
  ".mjs": "text/javascript; charset=utf-8",
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
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".ogv": "video/ogg",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
  ".oga": "audio/ogg",
  ".ogg": "audio/ogg",
  ".opus": "audio/opus",
  ".bmp": "image/bmp",
  ".pdf": "application/pdf",
};

async function isFile(target) {
  try {
    return (await stat(target)).isFile();
  } catch {
    return false;
  }
}

/**
 * Resolves a URL path under `root`, or null if it escapes. This is the trust
 * boundary for both the app bundle and the media folder — the renderer loads
 * remote content (YouTube iframes), so a path is never assumed safe.
 */
function resolveWithin(root, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const resolved = path.resolve(root, `.${path.posix.normalize(decoded)}`);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return resolved;
}

/**
 * Maps a request pathname to a file under `root`. Anything that isn't a real
 * file inside root — including traversal attempts — falls back to index.html,
 * mirroring the firebase.json "**" -> "/index.html" rewrite that lets a direct
 * navigation to /live or /program/:id boot the client-side router.
 */
async function resolveRequestPath(root, pathname) {
  const index = path.join(root, "index.html");
  const resolved = resolveWithin(root, pathname);
  if (!resolved) return index;
  return (await isFile(resolved)) ? resolved : index;
}

/**
 * Parses a single-byte-range header against a known file size.
 *
 * Returns null when absent or in a form we do not serve (multi-range: media
 * elements never ask for it), and "unsatisfiable" when the range falls outside
 * the file — that must answer 416, not silently send the whole file.
 */
function parseRange(header, size) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(String(header).trim());
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  if (rawStart === "" && rawEnd === "") return null;

  let start;
  let end;

  if (rawStart === "") {
    // bytes=-N — the final N bytes.
    const suffix = Number(rawEnd);
    if (suffix <= 0) return "unsatisfiable";
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === "" ? size - 1 : Math.min(Number(rawEnd), size - 1);
  }

  if (start >= size || start > end) return "unsatisfiable";
  return { start, end };
}

/**
 * Serves a file from the local media folder with byte-range support.
 *
 * Range handling is the whole reason this route exists rather than file://
 * URLs: <video> seeking depends on 206 responses. It replaces the
 * RangeRequestsPlugin + crossOrigin="anonymous" apparatus the service worker
 * needed to fake the same thing against Cache Storage.
 */
async function serveMedia(req, res, mediaRoot, pathname) {
  const file = resolveWithin(mediaRoot, pathname.slice(MEDIA_PREFIX.length - 1));
  if (!file) {
    res.writeHead(403).end();
    return;
  }

  let stats;
  try {
    stats = await stat(file);
  } catch {
    res.writeHead(404).end();
    return;
  }
  if (!stats.isFile()) {
    res.writeHead(404).end();
    return;
  }

  const type =
    MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
  const range = parseRange(req.headers.range, stats.size);

  if (range === "unsatisfiable") {
    res.writeHead(416, { "Content-Range": `bytes */${stats.size}` }).end();
    return;
  }

  if (range) {
    res.writeHead(206, {
      "Content-Type": type,
      "Content-Length": range.end - range.start + 1,
      "Content-Range": `bytes ${range.start}-${range.end}/${stats.size}`,
      "Accept-Ranges": "bytes",
    });
    createReadStream(file, { start: range.start, end: range.end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    "Content-Type": type,
    "Content-Length": stats.size,
    "Accept-Ranges": "bytes",
  });
  createReadStream(file).pipe(res);
}

function startAppServer(root, port, mediaRoot) {
  const server = createServer(async (req, res) => {
    const { pathname } = new URL(req.url, "http://127.0.0.1");

    if (mediaRoot && pathname.startsWith(MEDIA_PREFIX)) {
      await serveMedia(req, res, mediaRoot, pathname);
      return;
    }

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

module.exports = {
  startAppServer,
  resolveRequestPath,
  resolveWithin,
  parseRange,
};
