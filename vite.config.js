import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      injectRegister: null,
      manifest: false,
      injectManifest: {
        // Precache only the core app shell: index.html, the main JS/CSS
        // bundle, and the two tiny static files it references. Deliberately
        // NOT globbed broadly (e.g. "**/*.{js,css}") — that would also
        // sweep up pptxviewjs's chunks (PptxViewJS.es-*.js, jszip.min-*.js,
        // and three ~6-7MB chunks: rv60/nvi/ntv-*.js), which are lazily
        // import()-ed only when a .pptx is actually rendered. Eagerly
        // precaching ~20MB of a feature that may not be used that day on
        // every single page load would defeat the point of code-splitting
        // and directly work against this project's actual goal (avoid
        // heavy, unnecessary downloads). If pptx rendering is used while
        // genuinely offline, that's a known, accepted gap — those chunks
        // still load normally whenever there's a network connection.
        globPatterns: [
          "index.html",
          "manifest.json",
          "favicon.ico",
          "assets/index-*.js",
          "assets/index-*.css",
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      // pptxviewjs imports chart.js/auto; we skip Chart.js (no chart slides).
      "chart.js/auto": path.resolve(rootDir, "src/utils/chartJsStub.js"),
      "chart.js": path.resolve(rootDir, "src/utils/chartJsStub.js"),
    },
  },
});
