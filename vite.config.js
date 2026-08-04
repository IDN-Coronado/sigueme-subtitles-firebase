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
        // No app-shell precaching — this worker only runtime-caches
        // Firebase Storage media (added in a later PR).
        globPatterns: [],
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
