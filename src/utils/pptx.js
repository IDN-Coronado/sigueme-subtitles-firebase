import { mediaUrl } from "../local/mediaPath";

const bufferCache = new Map();
const thumbCache = new Map();

let pptxReady = null;

async function ensurePptxLibs() {
  if (pptxReady) return pptxReady;
  pptxReady = (async () => {
    const [{ PPTXViewer }, JSZipMod] = await Promise.all([
      import("pptxviewjs"),
      import("jszip"),
    ]);
    const JSZip = JSZipMod.default || JSZipMod;
    if (typeof globalThis !== "undefined" && !globalThis.JSZip) {
      globalThis.JSZip = JSZip;
    }
    return { PPTXViewer };
  })();
  return pptxReady;
}

function cacheKey({ url, storagePath }) {
  return storagePath || url || "";
}

/**
 * Load a PPTX ArrayBuffer from the local media folder. storagePath is
 * preferred; url is accepted for entries that predate it. No Storage SDK and
 * no bucket CORS involved any more — it is a same-origin fetch.
 */
export async function fetchPptxArrayBuffer({ url, storagePath } = {}) {
  const key = cacheKey({ url, storagePath });
  if (!key) throw new Error("Missing PPTX url or storagePath");

  if (bufferCache.has(key)) {
    const cached = await bufferCache.get(key);
    return cached.slice(0);
  }

  const promise = (async () => {
    const target = storagePath ? mediaUrl(storagePath) : url;
    const response = await fetch(target);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch PPTX: ${response.status} ${response.statusText}`
      );
    }
    return response.arrayBuffer();
  })();

  bufferCache.set(key, promise);
  try {
    const buffer = await promise;
    bufferCache.set(key, buffer);
    return buffer.slice(0);
  } catch (err) {
    bufferCache.delete(key);
    throw err;
  }
}

export async function createPptxViewer(canvas, options = {}) {
  const { PPTXViewer } = await ensurePptxLibs();
  return new PPTXViewer({
    canvas,
    enableThumbnails: false,
    autoRenderFirstSlide: false,
    autoChartRerenderDelayMs: 0,
    slideSizeMode: "fit",
    backgroundColor: "#000000",
    ...options,
  });
}

export function getCachedPptxThumbnail(url) {
  return thumbCache.get(url) || null;
}

export function setCachedPptxThumbnail(url, dataUrl) {
  if (url && dataUrl) thumbCache.set(url, dataUrl);
}
