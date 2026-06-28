import axios from "axios";
import { t } from "i18next";
import { v4 as uuidv4 } from "uuid";

import { useUserStore } from "@/store";

import { getChatToken, getIMToken } from "./storage";
import { feedbackToast } from "./common";

const tokenErrorCodeList = [1501, 1503, 1504, 1505, 1507];

type AuthAwareRequestConfig = {
  skipAuthLogout?: boolean;
};

const businessPublicPaths = new Set([
  "/account/code/send",
  "/account/code/verify",
  "/account/register",
  "/account/login",
  "/config",
  "/config/openim/status",
  "/console/login/context",
  "/console/login",
  "/console/platform/security/login/precheck",
  "/console/enterprise/security/login/precheck",
  "/console/security/login/guard-result",
  "/enterprise/code/validate",
]);

const getRequestPath = (url?: string) => {
  if (!url) {
    return "";
  }

  try {
    return new URL(url, "http://openim.local").pathname;
  } catch {
    return url.split("?")[0] ?? "";
  }
};

const withAccessTokenParam = (params: unknown, token: string) => {
  if (params instanceof URLSearchParams) {
    const nextParams = new URLSearchParams(params);
    if (!nextParams.has("access_token")) {
      nextParams.set("access_token", token);
    }
    return nextParams;
  }

  if (params && typeof params === "object" && !Array.isArray(params)) {
    return {
      ...(params as Record<string, unknown>),
      access_token:
        (params as Record<string, unknown>).access_token ??
        (params as Record<string, unknown>).accessToken ??
        token,
    };
  }

  return {
    access_token: token,
  };
};

const createAxiosInstance = (baseURL: string, imToken = false) => {
  const serves = axios.create({
    baseURL,
    timeout: 25000,
  });

  serves.interceptors.request.use(
    async (config) => {
      const storedToken = imToken ? await getIMToken() : await getChatToken();
      const token = typeof storedToken === "string" ? storedToken : undefined;
      if (token) {
        config.headers.token = config.headers.token ?? token;
        const requestPath = getRequestPath(config.url);
        if (!imToken && !businessPublicPaths.has(requestPath)) {
          config.params = withAccessTokenParam(config.params, token);
        }
      }
      config.headers.operationID = config.headers.operationID ?? uuidv4();
      return config;
    },
    (err) => Promise.reject(err),
  );

  serves.interceptors.response.use(
    (res) => {
      const data = res.data;

      const skipAuthLogout = Boolean(
        (res.config as AuthAwareRequestConfig).skipAuthLogout,
      );

      if (tokenErrorCodeList.includes(data.errCode) && !skipAuthLogout) {
        feedbackToast({
          msg: t("toast.loginExpiration"),
          error: t("toast.loginExpiration"),
          onClose: () => {
            useUserStore.getState().userLogout(true);
          },
        });
      }
      if ("errCode" in data) {
        if (data.errCode !== 0) {
          return Promise.reject(data);
        }
        return data;
      }
      if ("resultCode" in data) {
        if (data.resultCode !== 1) {
          return Promise.reject(data);
        }
        return data;
      }
      return data;
    },
    (err) => {
      if (err.message.includes("timeout")) {
        console.error("error", err);
      }
      if (err.message.includes("Network Error")) {
        console.error("error", err);
      }
      return Promise.reject(err);
    },
  );

  return serves;
};

export default createAxiosInstance;
