import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import { mediaUrl } from "../local/mediaPath";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const bufferCache = new Map();
const thumbCache = new Map();

function cacheKey({ url, storagePath }) {
  return storagePath || url || "";
}

/**
 * Load a PDF ArrayBuffer from the local media folder. storagePath is
 * preferred; url is accepted for entries that predate it. No Storage SDK and
 * no bucket CORS involved any more — it is a same-origin fetch.
 *
 * Always hands out a copy: pdf.js transfers (detaches) the buffer it is given,
 * which would empty the cache entry for every later reader.
 */
export async function fetchPdfArrayBuffer({ url, storagePath } = {}) {
  const key = cacheKey({ url, storagePath });
  if (!key) throw new Error("Missing PDF url or storagePath");

  if (bufferCache.has(key)) {
    const cached = await bufferCache.get(key);
    return cached.slice(0);
  }

  const promise = (async () => {
    const target = storagePath ? mediaUrl(storagePath) : url;
    const response = await fetch(target);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch PDF: ${response.status} ${response.statusText}`
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

/** Resolves to a PDFDocumentProxy. Callers own it and must destroy() it. */
export async function createPdfDocument(buffer) {
  return pdfjsLib.getDocument({ data: buffer }).promise;
}

export function getCachedPdfThumbnail(url) {
  return thumbCache.get(url) || null;
}

export function setCachedPdfThumbnail(url, dataUrl) {
  if (url && dataUrl) thumbCache.set(url, dataUrl);
}
