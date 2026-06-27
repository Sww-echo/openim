import { loadEnv, type ProxyOptions } from "vite";

export const createBusinessApiProxy = (mode: string) => {
  const env = loadEnv(mode, process.cwd(), "");
  const businessApiTarget =
    env.VITE_BUSINESS_API_TARGET || "http://47.238.134.161:8092";

  return {
    "/business-api": {
      target: businessApiTarget,
      changeOrigin: true,
      rewrite: (proxyPath) => proxyPath.replace(/^\/business-api/, ""),
    },
  } satisfies Record<string, ProxyOptions>;
};
