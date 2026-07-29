import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // pptxviewjs imports chart.js/auto; we skip Chart.js (no chart slides).
      "chart.js/auto": path.resolve(rootDir, "src/utils/chartJsStub.js"),
      "chart.js": path.resolve(rootDir, "src/utils/chartJsStub.js"),
    },
  },
});
