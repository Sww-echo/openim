import { t } from "i18next";
import { useMutation, useQuery } from "react-query";
import { v4 as uuidv4 } from "uuid";

import {
  isBusinessRecord,
  pickBusinessText,
  unwrapBusinessPayload,
} from "@/utils/businessPayload";

import businessRequest from "./business";
import { errorHandle } from "./errorHandle";

const platform = window.electronAPI?.getPlatform() ?? 5;

export const DEFAULT_ENTERPRISE_CODE = "ENT-619057BE";

const normalizeAuthText = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const normalizePasswordText = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const normalizeOptionalAuthText = (value: unknown) =>
  normalizeAuthText(value) || undefined;

const normalizeEnterpriseCodeText = (value: unknown) =>
  normalizeAuthText(value) || DEFAULT_ENTERPRISE_CODE;

const normalizeBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalizedValue)) {
      return true;
    }
    if (["false", "0", "no"].includes(normalizedValue)) {
      return false;
    }
  }

  return fallback;
};

const normalizeRegistrationMethods = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map(normalizeAuthText).filter(Boolean);
  }
  const text = normalizeAuthText(value);
  return text ? text.split(",").map(normalizeAuthText).filter(Boolean) : [];
};

const getAreaCode = (code?: string) => {
  const normalizedCode = normalizeAuthText(code);
  return normalizedCode
    ? normalizedCode.includes("+")
      ? normalizedCode
      : `+${normalizedCode}`
    : undefined;
};

const normalizeAccountCodeParams = <
  T extends {
    areaCode?: string;
    phoneNumber?: string;
    email?: string;
    enterpriseCode?: string;
    invitationCode?: string;
    verifyCode?: string;
  },
>(
  params: T,
) => {
  const {
    enterpriseCode: _enterpriseCode,
    invitationCode: _invitationCode,
    verifyCode: rawVerifyCode,
    ...restParams
  } = params as T & { verifyCode?: string };

  const verifyCode = normalizeOptionalAuthText(rawVerifyCode);
  const email = normalizeOptionalAuthText(params.email);
  const phoneNumber = normalizeAuthText(params.phoneNumber);

  return {
    ...restParams,
    enterpriseCode: normalizeEnterpriseCodeText(params.enterpriseCode),
    areaCode: getAreaCode(params.areaCode),
    ...(email ? { email } : {}),
    phoneNumber,
    telephone: phoneNumber,
    ...(verifyCode ? { verifyCode } : {}),
  };
};

const normalizeLoginParams = (params: API.Login.LoginParams) => {
  const {
    enterpriseCode: _enterpriseCode,
    invitationCode: _invitationCode,
    ...restParams
  } = params;

  return {
    ...restParams,
    phoneNumber: normalizeAuthText(params.phoneNumber),
    account: normalizeOptionalAuthText(params.account),
    password: normalizePasswordText(params.password),
    enterpriseCode: normalizeEnterpriseCodeText(params.enterpriseCode),
    platform,
    areaCode: getAreaCode(params.areaCode),
  };
};

const normalizeRegisterParams = (params: API.Login.DemoRegisterType) => {
  const {
    enterpriseCode: _enterpriseCode,
    invitationCode: _invitationCode,
    verifyCode: rawVerifyCode,
    ...restParams
  } = params;
  const phoneNumber = normalizeAuthText(params.user.phoneNumber);
  const verifyCode = normalizeOptionalAuthText(rawVerifyCode);

  return {
    ...restParams,
    enterpriseCode: normalizeEnterpriseCodeText(params.enterpriseCode),
    ...(verifyCode ? { verifyCode } : {}),
    user: {
      ...params.user,
      nickname: normalizeAuthText(params.user.nickname),
      faceURL: normalizeAuthText(params.user.faceURL),
      email: normalizeOptionalAuthText(params.user.email),
      account: normalizeOptionalAuthText(params.user.account) ?? phoneNumber,
      areaCode: getAreaCode(params.user.areaCode),
      phoneNumber,
      telephone: phoneNumber,
      password: normalizePasswordText(params.user.password),
    },
    platform,
  };
};

const getAllowedIpsText = (value: unknown) =>
  Array.isArray(value)
    ? value.map(normalizeAuthText).filter(Boolean).join(", ")
    : normalizeAuthText(value);

const getAuthRestrictionMessage = (payload: unknown) => {
  const record = isBusinessRecord(payload) ? payload : {};
  const curfew = isBusinessRecord(record.curfew) ? record.curfew : {};
  const allowed = record.allowed ?? curfew.allowed;
  const reason = normalizeAuthText(record.reason ?? curfew.reason);
  const reasonText = normalizeAuthText(
    record.reasonText ??
      record.warningMessage ??
      record.message ??
      record.msg ??
      curfew.reasonText ??
      curfew.warningMessage ??
      curfew.message,
  );
  const nextAvailableTime = normalizeAuthText(
    record.nextAvailableTime ?? curfew.nextAvailableTime,
  );

  if (allowed === false || allowed === "false" || allowed === 0 || allowed === "0") {
    if (
      reason === "user_login_ip_not_allowed" ||
      record.clientIp ||
      record.allowedIps
    ) {
      return (
        reasonText ||
        t("toast.loginIpNotAllowed", {
          clientIp: normalizeAuthText(record.clientIp),
          allowedIps: getAllowedIpsText(record.allowedIps),
        })
      );
    }

    if (reason.includes("curfew") || Object.keys(curfew).length > 0) {
      return (
        reasonText ||
        t("toast.loginCurfewBlocked", {
          nextAvailableTime,
        })
      );
    }

    return reasonText || t("toast.loginRestricted");
  }

  if (record.enabled === false || record.enabled === "false") {
    return reasonText || t("toast.invalidOpenIMTokenResponse");
  }

  return undefined;
};

const rejectUnsupportedLatestApiDoc = () =>
  Promise.reject(new Error(t("toast.unsupportedByLatestApiDoc")));

export interface LoginSuccessData {
  chatToken?: string;
  imToken?: string;
  openIMToken?: string;
  token?: string;
  userID?: string;
  access_token?: string;
  access_Token?: string;
  accessToken?: string;
  userId?: string | number;
  nickname?: string;
  faceURL?: string;
  openIM?: {
    token?: string;
    userID?: string;
    userId?: string | number;
  };
}

export interface RegistrationConfig {
  registrationVerificationRequired: boolean;
  registrationMethods: string[];
  passwordRegistrationAllowed: boolean;
}

const normalizeRegistrationConfig = (response: unknown): RegistrationConfig => {
  const payload = unwrapBusinessPayload(response);
  const record = isBusinessRecord(payload) ? payload : {};

  return {
    registrationVerificationRequired: normalizeBoolean(
      record.registrationVerificationRequired,
      false,
    ),
    registrationMethods: normalizeRegistrationMethods(record.registrationMethods),
    passwordRegistrationAllowed: normalizeBoolean(
      record.passwordRegistrationAllowed,
      true,
    ),
  };
};

export const getRegistrationConfig = async (enterpriseCode?: string) => {
  const normalizedEnterpriseCode = normalizeOptionalAuthText(enterpriseCode);
  const response = await businessRequest.get("/config", {
    params: normalizedEnterpriseCode
      ? {
          enterpriseCode: normalizedEnterpriseCode,
        }
      : undefined,
  });

  return normalizeRegistrationConfig(response);
};

export const useRegistrationConfig = (enterpriseCode?: string) => {
  const normalizedEnterpriseCode = normalizeOptionalAuthText(enterpriseCode);

  return useQuery(
    ["registrationConfig", normalizedEnterpriseCode],
    () => getRegistrationConfig(normalizedEnterpriseCode),
    {
      retry: false,
      staleTime: 30000,
    },
  );
};

export const normalizeIMProfile = (data: LoginSuccessData) => {
  const restrictionMessage = getAuthRestrictionMessage(data);
  if (restrictionMessage) {
    throw new Error(restrictionMessage);
  }

  const chatToken = normalizeAuthText(
    data.chatToken ?? data.access_token ?? data.access_Token ?? data.accessToken,
  );
  const imToken = normalizeAuthText(data.imToken ?? data.openIM?.token);
  const userID = normalizeAuthText(
    data.userID ?? data.openIM?.userID ?? data.openIM?.userId ?? data.userId,
  );

  if (!chatToken || !imToken || !userID) {
    throw new Error(t("toast.invalidLoginResponse"));
  }

  return {
    chatToken,
    imToken,
    userID,
  };
};

export const normalizeOpenIMTokenProfile = (data: unknown, fallbackUserID?: string) => {
  const payload = unwrapBusinessPayload(data);
  const record = isBusinessRecord(payload) ? payload : {};
  const restrictionMessage = getAuthRestrictionMessage(record);
  if (restrictionMessage) {
    throw new Error(restrictionMessage);
  }

  const openIM = isBusinessRecord(record.openIM) ? record.openIM : {};
  const imToken = normalizeAuthText(
    pickBusinessText(record, ["imToken", "openIMToken", "token"]) ||
      pickBusinessText(openIM, ["token"]),
  );
  const userID = normalizeAuthText(
    pickBusinessText(record, ["userID", "userId"]) ||
      pickBusinessText(openIM, ["userID", "userId"]) ||
      fallbackUserID,
  );

  if (!imToken || !userID) {
    throw new Error(t("toast.invalidOpenIMTokenResponse"));
  }

  return {
    imToken,
    userID,
  };
};

// Send verification code
export const useSendSms = () => {
  return useMutation(
    (params: API.Login.SendSmsParams) => {
      const normalizedParams = normalizeAccountCodeParams(params);
      if (!normalizedParams.phoneNumber && !normalizedParams.email) {
        return Promise.reject(new Error(t("toast.inputPhoneNumber")));
      }

      return businessRequest.post("/account/code/send", undefined, {
        params: normalizedParams,
        headers: {
          operationID: uuidv4(),
        },
      });
    },
    {
      onError: errorHandle,
    },
  );
};

// Verify mobile phone number
export const useVerifyCode = () => {
  return useMutation(
    (params: API.Login.VerifyCodeParams) => {
      const normalizedParams = normalizeAccountCodeParams(params);
      if (!normalizedParams.phoneNumber && !normalizedParams.email) {
        return Promise.reject(new Error(t("toast.inputPhoneNumber")));
      }
      if (!normalizedParams.verifyCode) {
        return Promise.reject(new Error(t("toast.inputVerifyCode")));
      }

      return businessRequest.post("/account/code/verify", undefined, {
        params: normalizedParams,
        headers: {
          operationID: uuidv4(),
        },
      });
    },
    {
      onError: errorHandle,
    },
  );
};

// register
export const useRegister = () => {
  return useMutation(
    (params: API.Login.DemoRegisterType) => {
      const normalizedParams = normalizeRegisterParams(params);
      if (!normalizedParams.user.phoneNumber) {
        return Promise.reject(new Error(t("toast.inputPhoneNumber")));
      }
      if (!normalizedParams.user.nickname) {
        return Promise.reject(new Error(t("toast.inputNickName")));
      }
      if (!normalizedParams.user.password) {
        return Promise.reject(new Error(t("toast.inputPassword")));
      }

      return businessRequest.post<LoginSuccessData>(
        "/account/register",
        normalizedParams,
        {
          headers: {
            operationID: uuidv4(),
          },
        },
      );
    },
    {
      onError: errorHandle,
    },
  );
};

// reset passwords
export const useReset = () => {
  return useMutation(
    (params: API.Login.ResetParams) => {
      void params;
      return rejectUnsupportedLatestApiDoc();
    },
    {
      onError: errorHandle,
    },
  );
};

// change password
export const verifyBusinessPassword = (password: string | number) => {
  void password;
  return rejectUnsupportedLatestApiDoc();
};

export const modifyPassword = async (params: API.Login.ModifyParams) => {
  void params;
  return rejectUnsupportedLatestApiDoc();
};

// log in
export const useLogin = () => {
  return useMutation(
    (params: API.Login.LoginParams) => {
      const normalizedParams = normalizeLoginParams(params);
      if (!normalizedParams.phoneNumber) {
        return Promise.reject(new Error(t("toast.inputPhoneNumber")));
      }
      if (!normalizedParams.password) {
        return Promise.reject(new Error(t("toast.inputPassword")));
      }

      return businessRequest.post<LoginSuccessData>(
        "/account/login",
        normalizedParams,
        {
          headers: {
            operationID: uuidv4(),
          },
        },
      );
    },
    {
      onError: errorHandle,
    },
  );
};

export const validateEnterpriseCode = async (code: string) => {
  const normalizedCode = normalizeAuthText(code);
  if (!normalizedCode) {
    return Promise.reject(new Error(t("toast.inputEnterpriseCode")));
  }

  return businessRequest.get<EnterpriseCodeValidateResult>(
    "/enterprise/code/validate",
    {
      params: {
        code: normalizedCode,
      },
    },
  );
};

export const useValidateEnterpriseCode = () => {
  return useMutation((code: string) => validateEnterpriseCode(code), {
    onError: errorHandle,
  });
};

export const refreshOpenIMToken = async (options?: { skipAuthLogout?: boolean }) => {
  const config = options?.skipAuthLogout
    ? ({ skipAuthLogout: true } as Parameters<typeof businessRequest.get>[1])
    : undefined;

  return businessRequest.get<LoginSuccessData>("/user/openim/token", config);
};

export const getOpenIMConfigStatus = () =>
  businessRequest.get<{
    apiURL?: string;
    apiUrl?: string;
    openIMApiURL?: string;
    wsURL?: string;
    wsUrl?: string;
    openIMWsURL?: string;
    platformID?: number | string;
    platformId?: number | string;
  }>("/config/openim/status");

export interface EnterpriseCodeValidateResult {
  valid?: boolean;
  companyId?: string | number;
  companyID?: string | number;
  companyCode?: string;
  companyName?: string;
  enterpriseName?: string;
  invitationCode?: string;
  [key: string]: unknown;
}

export type { BusinessUserInfo } from "./friend";
export {
  BusinessAllowType,
  getBusinessUserBindInfo,
  getBusinessUserByAccount,
  getBusinessUserInfo,
  getBusinessUserInfoV1,
  getCurrentBusinessUserInfo,
  searchBusinessUserInfo,
  updateBusinessUserInfo,
} from "./friend";
