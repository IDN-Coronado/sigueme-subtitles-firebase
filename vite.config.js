import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    // Local assets are served by the Electron main process (electron/media.js).
    // Proxying here lets asset URLs stay relative — /media/general/foo.mp4 —
    // in both `npm run desktop` and `npm run desktop:dev`.
    proxy: {
      "/media": "http://127.0.0.1:5178",
    },
  },
  resolve: {
    alias: {
      // pptxviewjs imports chart.js/auto; we skip Chart.js (no chart slides).
      "chart.js/auto": path.resolve(rootDir, "src/utils/chartJsStub.js"),
      "chart.js": path.resolve(rootDir, "src/utils/chartJsStub.js"),
    },
  },
});
