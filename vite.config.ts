import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: "dist",
  },
});