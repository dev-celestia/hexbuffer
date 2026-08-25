import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  worker: {
    format: "es",
  },
  optimizeDeps: {
    // @celestia-project/ui's dist contains Vite-specific `?worker` imports for Monaco
    // workers; esbuild's dep optimizer cannot resolve the `?worker` query, so
    // serve it as source and let Vite's worker plugin handle those imports.
    exclude: ["monaco-editor"],
    // Force-bundle the CJS use-sync-external-store shims so Vite doesn't serve
    // them as raw CJS to the browser (causes "Importing binding name not found").
    include: [
      "use-sync-external-store",
      "use-sync-external-store/shim",
      "use-sync-external-store/shim/with-selector",
    ],
  },
  server: {
    port: 1420,
    strictPort: true,
    host: "127.0.0.1",
  },
  resolve: {
    alias: [
      {
        find: /^monaco-editor\/esm\/vs\/(.*)/,
        replacement: "monaco-editor/$1",
      },
      {
        find: "@/components",
        replacement: path.resolve(__dirname, "./src/components"),
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "./src"),
      },
    ],
  },
  build: {
    outDir: "dist-app",
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        splashscreen: path.resolve(__dirname, "splashscreen.html"),
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Heavy standalone packages isolated for route-level / on-demand loading
            if (id.includes("monaco-editor")) return "vendor-monaco";
            if (id.includes("jspdf")) return "vendor-jspdf";
            if (id.includes("xterm") || id.includes("@xterm")) return "vendor-xterm";
            if (id.includes("@xyflow") || id.includes("reactflow")) return "vendor-reactflow";
            if (id.includes("motion")) return "vendor-motion";
            if (id.includes("@tauri-apps")) return "vendor-tauri";
            if (id.includes("@phosphor-icons")) return "vendor-phosphor";
          }
        },
      },
    },
  },
});
