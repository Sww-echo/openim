import http from "node:http";
import https from "node:https";

import { loadEnv, type Plugin, type ProxyOptions } from "vite";

const enterpriseApiProxyPrefix = "/enterprise-api-proxy";
const enterpriseApiTargetHeader = "x-enterprise-api-base-url";

const getHeaderText = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const createEnterpriseApiProxyPlugin = (): Plugin => ({
  name: "openim-enterprise-api-proxy",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use(enterpriseApiProxyPrefix, (req, res, next) => {
      const targetBaseURL = getHeaderText(req.headers[enterpriseApiTargetHeader]);
      if (!targetBaseURL) {
        next();
        return;
      }

      let targetURL: URL;
      try {
        const requestPath = req.url?.startsWith(enterpriseApiProxyPrefix)
          ? req.url.slice(enterpriseApiProxyPrefix.length)
          : req.url || "/";
        const requestURL = new URL(requestPath || "/", "http://openim.local");
        const baseURL = new URL(targetBaseURL);
        const basePath = baseURL.pathname.replace(/\/$/, "");
        const nextPath = requestURL.pathname.replace(/^\//, "");
        targetURL = new URL(baseURL.href);
        targetURL.pathname = [basePath, nextPath].filter(Boolean).join("/");
        targetURL.search = requestURL.search;
      } catch {
        res.statusCode = 400;
        res.end("Invalid enterprise api proxy target");
        return;
      }

      const headers = { ...req.headers };
      delete headers[enterpriseApiTargetHeader];
      delete headers.host;

      const proxyRequest = (targetURL.protocol === "https:" ? https : http).request(
        targetURL,
        {
          method: req.method,
          headers: {
            ...headers,
            host: targetURL.host,
          },
        },
        (proxyResponse) => {
          res.writeHead(proxyResponse.statusCode ?? 500, proxyResponse.headers);
          proxyResponse.pipe(res);
        },
      );

      proxyRequest.on("error", (error) => {
        res.statusCode = 502;
        res.end(error.message);
      });

      req.pipe(proxyRequest);
    });
  },
});

export const createBusinessApiProxy = (mode: string) => {
  const env = loadEnv(mode, process.cwd(), "");
  const businessApiTarget =
    env.VITE_BUSINESS_API_TARGET || "http://47.238.134.161:8092";
  const platformApiTarget =
    env.VITE_PLATFORM_API_TARGET || "https://platform.yuxinim.com";

  return {
    "/api/platform": {
      target: platformApiTarget,
      changeOrigin: true,
    },
    "/business-api": {
      target: businessApiTarget,
      changeOrigin: true,
      rewrite: (proxyPath) => proxyPath.replace(/^\/business-api/, ""),
    },
  } satisfies Record<string, ProxyOptions>;
};
