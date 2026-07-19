import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// The webview bundle is emitted straight into the extension package so it ships
// inside the VSIX. Fixed filenames keep the extension's HTML template simple.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL("../extension/media/webview", import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "index.js",
        assetFileNames: "index.[ext]",
        chunkFileNames: "[name].js",
      },
    },
    // Webviews load one script; avoid code-splitting so a single <script> works.
    target: "es2020",
  },
});
