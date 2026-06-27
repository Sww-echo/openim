import { t } from "i18next";

import businessRequest from "./business";

export enum ReportTargetType {
  User = 1,
  Room = 2,
}

export interface ReportBusinessTargetParams {
  toUserId?: string | number;
  roomId?: string | number;
  webUrl?: string;
  reason?: string;
  reportType: ReportTargetType | number;
  reportInfo?: string;
}

interface NormalizedReportBusinessTargetParams {
  toUserId?: string;
  roomId?: string;
  webUrl?: string;
  reason?: string;
  reportType: ReportTargetType | number;
  reportInfo?: string;
}

const normalizeReportText = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const normalizeReportParams = ({
  toUserId,
  roomId,
  webUrl,
  reason,
  reportType,
  reportInfo,
}: ReportBusinessTargetParams): NormalizedReportBusinessTargetParams => {
  const normalizedToUserId = normalizeReportText(toUserId);
  const normalizedRoomId = normalizeReportText(roomId);
  const normalizedWebUrl = normalizeReportText(webUrl);
  const normalizedReason = normalizeReportText(reason);
  const normalizedReportInfo = normalizeReportText(reportInfo);

  if (!normalizedToUserId && !normalizedRoomId) {
    throw new Error(t("toast.sendApplicationFailed"));
  }

  return {
    ...(normalizedToUserId ? { toUserId: normalizedToUserId } : {}),
    ...(normalizedRoomId ? { roomId: normalizedRoomId } : {}),
    ...(normalizedWebUrl ? { webUrl: normalizedWebUrl } : {}),
    ...(normalizedReason ? { reason: normalizedReason } : {}),
    reportType,
    ...(normalizedReportInfo ? { reportInfo: normalizedReportInfo } : {}),
  };
};

export const checkReportUrl = (webUrl?: string | number) => {
  const normalizedWebUrl = normalizeReportText(webUrl);
  if (!normalizedWebUrl) {
    return Promise.resolve({});
  }

  return businessRequest.post<unknown>("/user/checkReportUrl", undefined, {
    params: {
      webUrl: normalizedWebUrl,
    },
  });
};

export const reportBusinessTarget = async (params: ReportBusinessTargetParams) => {
  const normalizedParams = normalizeReportParams(params);

  try {
    await checkReportUrl(normalizedParams.webUrl as string | undefined);
  } catch (error) {
    console.debug("check report url failed", error);
  }

  return businessRequest.post<unknown>("/user/report", undefined, {
    params: normalizedParams,
  });
};
