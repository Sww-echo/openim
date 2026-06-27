import {
  isBusinessRecord,
  pickBusinessText,
  unwrapBusinessPayload,
} from "@/utils/businessPayload";
import { getIMUserID } from "@/utils/storage";

import businessRequest from "./business";
import { BusinessAllowType } from "./friend";

export interface UserPrivacySettings {
  friendsVerify?: BusinessAllowType | number;
  offlineNoPushMsg?: 0 | 1 | number;
  phoneSearch?: 0 | 1 | number;
  nameSearch?: 0 | 1 | number;
  isTyping?: 0 | 1 | number;
  isVibration?: 0 | 1 | number;
  isShowMsgState?: 0 | 1 | number;
  [key: string]: unknown;
}

export interface UpdateUserPrivacySettingsParams {
  friendsVerify?: BusinessAllowType | number;
  offlineNoPushMsg?: 0 | 1 | number;
  phoneSearch?: 0 | 1 | number;
  nameSearch?: 0 | 1 | number;
  isTyping?: 0 | 1 | number;
  isVibration?: 0 | 1 | number;
  isShowMsgState?: 0 | 1 | number;
}

const normalizeSettingsText = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const normalizeSettingsNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const normalizeSettingsParams = (params: UpdateUserPrivacySettingsParams) =>
  Object.entries(params).reduce((nextParams, [key, value]) => {
    if (value === undefined || value === null) {
      return nextParams;
    }

    const numberValue = normalizeSettingsNumber(value);
    if (numberValue !== undefined) {
      nextParams[key] = numberValue;
    }

    return nextParams;
  }, {} as Record<string, number>);

const getCurrentUserID = async () => normalizeSettingsText(await getIMUserID());

const normalizeUserPrivacySettings = (response: unknown): UserPrivacySettings => {
  const payload = unwrapBusinessPayload(response);
  const record = isBusinessRecord(payload) ? payload : {};
  const settings = isBusinessRecord(record.settings) ? record.settings : record;

  return {
    ...settings,
    friendsVerify: normalizeSettingsNumber(
      pickBusinessText(settings, ["friendsVerify", "allowAddFriend"]),
    ),
    offlineNoPushMsg: normalizeSettingsNumber(settings.offlineNoPushMsg),
    phoneSearch: normalizeSettingsNumber(settings.phoneSearch),
    nameSearch: normalizeSettingsNumber(settings.nameSearch),
    isTyping: normalizeSettingsNumber(settings.isTyping),
    isVibration: normalizeSettingsNumber(settings.isVibration),
    isShowMsgState: normalizeSettingsNumber(settings.isShowMsgState),
  };
};

export const getUserPrivacySettings = async () => {
  const userId = await getCurrentUserID();

  return normalizeUserPrivacySettings(
    await businessRequest.post<unknown>("/user/settings", undefined, {
      params: userId ? { userId } : undefined,
    }),
  );
};

export const updateUserPrivacySettings = (
  params: UpdateUserPrivacySettingsParams,
) => {
  const normalizedParams = normalizeSettingsParams(params);

  if (!Object.keys(normalizedParams).length) {
    return Promise.resolve({});
  }

  return businessRequest.post<unknown>("/user/settings/update", undefined, {
    params: normalizedParams,
  });
};

export const updateGlobalOfflineNoPushMsg = (offlineNoPushMsg: 0 | 1 | number) => {
  const normalizedValue = normalizeSettingsNumber(offlineNoPushMsg);

  if (normalizedValue === undefined) {
    return Promise.resolve({});
  }

  return businessRequest.post<unknown>("/user/update/OfflineNoPushMsg", undefined, {
    params: {
      offlineNoPushMsg: normalizedValue,
    },
  });
};
