import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const createBusinessApiProxy = (mode) => {
  const env = loadEnv(mode, rootDir, "");
  const businessApiTarget =
    env.VITE_BUSINESS_API_TARGET || "http://47.238.134.161:8092";

  return {
    "/business-api": {
      target: businessApiTarget,
      changeOrigin: true,
      rewrite: (proxyPath) => proxyPath.replace(/^\/business-api/, ""),
    },
  };
};

export default defineConfig(({ mode }) => ({
  root: rootDir,
  resolve: {
    alias: {
      "@": path.join(rootDir, "src"),
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
}));
