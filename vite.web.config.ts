import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { createBusinessApiProxy } from "./vite.proxy";

export default defineConfig(({ mode }) => {
  return {
    resolve: {
      alias: {
        "@": path.join(__dirname, "src"),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ["legacy-js-api"],
        },
      },
    },
    plugins: [react()],
    server: {
      proxy: createBusinessApiProxy(mode),
    },
    clearScreen: false,
    build: {
      sourcemap: false,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 500,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
  };
});
