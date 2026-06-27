import { t } from "i18next";
import { v4 as uuidv4 } from "uuid";

import businessRequest from "./business";
import { getChatToken } from "@/utils/storage";

const emptyRtcResponse = () => Promise.reject(new Error(t("toast.connectFailed")));

const normalizeRtcText = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

export const getRtcConnectData = async (room: string, identity: string) => {
  const normalizedRoom = normalizeRtcText(room);
  const normalizedIdentity = normalizeRtcText(identity);
  if (!normalizedRoom || !normalizedIdentity) {
    return emptyRtcResponse();
  }

  const token = (await getChatToken()) as string;
  return businessRequest.post<{ serverUrl: string; token: string }>(
    "/user/rtc/get_token",
    {
      room: normalizedRoom,
      identity: normalizedIdentity,
    },
    {
      headers: {
        token,
        operationID: uuidv4(),
      },
    },
  );
};
