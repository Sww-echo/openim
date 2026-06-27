import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { createServer, loadEnv } from "vite";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mode = process.env.NODE_ENV || "development";
const env = loadEnv(mode, rootDir, "");
const businessApiTarget =
  env.VITE_BUSINESS_API_TARGET || "http://47.238.134.161:8092";

const server = await createServer({
  configFile: false,
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
    host: "127.0.0.1",
    port: 7777,
    proxy: {
      "/business-api": {
        target: businessApiTarget,
        changeOrigin: true,
        rewrite: (proxyPath) => proxyPath.replace(/^\/business-api/, ""),
      },
    },
  },
  clearScreen: false,
});

await server.listen();
server.printUrls();
