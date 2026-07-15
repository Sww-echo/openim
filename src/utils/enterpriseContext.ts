import * as localForage from "localforage";

import { isBusinessRecord, pickBusinessText, unwrapBusinessPayload } from "./businessPayload";
import { getFeedbackErrorMessage } from "./common";

const ENTERPRISE_CONTEXTS_KEY = "IM_ENTERPRISE_CONTEXTS";
const CURRENT_ENTERPRISE_CODE_KEY = "IM_CURRENT_ENTERPRISE_CODE";
const enterpriseStorage = localForage.createInstance({
  name: "OpenCorp-Config",
});

export interface EnterpriseEndpoints {
  businessApi?: string;
  openIMApi?: string;
  openIMWs?: string;
  attachmentApi?: string;
  rtcTokenApi?: string;
  liveKitWs?: string;
}

export interface EnterpriseContext {
  enterpriseCode: string;
  enterpriseName?: string;
  baseUrl?: string;
  endpoints: EnterpriseEndpoints;
}

const normalizeText = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const readContexts = async () =>
  (await enterpriseStorage.getItem<Record<string, EnterpriseContext>>(
    ENTERPRISE_CONTEXTS_KEY,
  )) ?? {};

export const getCurrentEnterpriseCode = () =>
  localStorage.getItem(CURRENT_ENTERPRISE_CODE_KEY) || undefined;

export const setCurrentEnterpriseCode = (enterpriseCode: string) => {
  localStorage.setItem(CURRENT_ENTERPRISE_CODE_KEY, enterpriseCode);
};

export const getCurrentEnterpriseContext = async () => {
  const enterpriseCode = getCurrentEnterpriseCode();
  if (!enterpriseCode) {
    return undefined;
  }

  return (await readContexts())[enterpriseCode];
};

export const saveEnterpriseContext = async (context: EnterpriseContext) => {
  const contexts = await readContexts();
  await enterpriseStorage.setItem(ENTERPRISE_CONTEXTS_KEY, {
    ...contexts,
    [context.enterpriseCode]: context,
  });
  setCurrentEnterpriseCode(context.enterpriseCode);
  return context;
};

export const normalizeEnterpriseResolveResponse = (response: unknown) => {
  const payload = unwrapBusinessPayload(response);
  const record = isBusinessRecord(payload) ? payload : {};
  const endpoints = isBusinessRecord(record.endpoints) ? record.endpoints : {};
  const enterpriseCode = normalizeText(record.enterpriseCode);

  if (!enterpriseCode) {
    throw new Error(getFeedbackErrorMessage(record) ?? "企业号解析失败");
  }

  return {
    enterpriseCode,
    enterpriseName: pickBusinessText(record, ["enterpriseName"]),
    baseUrl: pickBusinessText(record, ["baseUrl", "baseURL"]),
    endpoints: {
      businessApi: pickBusinessText(endpoints, ["businessApi", "businessAPI"]),
      openIMApi: pickBusinessText(endpoints, ["openIMApi", "openIMAPI"]),
      openIMWs: pickBusinessText(endpoints, ["openIMWs", "openIMWS"]),
      attachmentApi: pickBusinessText(endpoints, ["attachmentApi", "attachmentAPI"]),
      rtcTokenApi: pickBusinessText(endpoints, ["rtcTokenApi", "rtcTokenAPI"]),
      liveKitWs: pickBusinessText(endpoints, ["liveKitWs", "liveKitWS"]),
    },
  } satisfies EnterpriseContext;
};

export const getCurrentBusinessApiBaseURL = async () => {
  const context = await getCurrentEnterpriseContext();
  return context?.endpoints.businessApi || context?.baseUrl;
};

export const getEnterpriseApiProxyBaseURL = () => "/enterprise-api-proxy";
