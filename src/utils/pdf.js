import { getBytes, ref as storageRef } from "firebase/storage";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import storage from "../firebase/storage";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const bufferCache = new Map();
const thumbCache = new Map();

function cacheKey({ url, storagePath }) {
  return storagePath || url || "";
}

/**
 * Load a PDF ArrayBuffer.
 * Prefer Firebase Storage getBytes when storagePath is available;
 * fall back to fetch(url). Both require Storage bucket CORS for browser use.
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
    if (storagePath) {
      return getBytes(storageRef(storage, storagePath));
    }
    const response = await fetch(url);
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
  const task = pdfjsLib.getDocument({ data: buffer });
  const doc = await task.promise;
  // pdfjs-dist 4+ moved destroy() to the loading task, not the document proxy
  if (typeof doc.destroy !== "function") {
    doc.destroy = () => task.destroy();
  }
  return doc;
}

export function getCachedPdfThumbnail(url) {
  return thumbCache.get(url) || null;
}

export function setCachedPdfThumbnail(url, dataUrl) {
  if (url && dataUrl) thumbCache.set(url, dataUrl);
}
