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
    // The UI package is linked from celestia-starter, which carries its own
    // dev-install of React; force a single React instance across the app.
    dedupe: ["react", "react-dom"],
    alias: [
      {
        // Resolve the UI package to the local celestia-starter workspace so
        // newly added components (e.g. block-text-editor) are picked up
        // without publishing a new package version.
        find: /^@celestia-project\/ui$/,
        replacement: path.resolve(
          __dirname,
          "../celestia-starter/packages/ui/src/index.ts"
        ),
      },
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
    outDir: "dist-app-out",
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
