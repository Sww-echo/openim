import { MessageStatus, MessageType } from "@openim/wasm-client-sdk";
import { MessageItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { SendMsgParams } from "@openim/wasm-client-sdk/lib/types/params";
import { useCallback } from "react";

import { groupSendBefore, singleSendBefore } from "@/api/chat";
import { getBusinessFileFromMessageEx } from "@/api/file";
import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore } from "@/store";
import { BusinessRecord, pickExplicitBusinessRoomId } from "@/utils/businessPayload";
import { feedbackToast, isSameID } from "@/utils/common";
import { emit } from "@/utils/events";

import { pushNewMessage, updateOneMessage } from "../useHistoryMessageList";

export type SendMessageParams = Partial<Omit<SendMsgParams, "message">> & {
  message: MessageItem;
  needPush?: boolean;
};

const getContentText = (message: MessageItem) => {
  if (message.contentType === MessageType.TextMessage) {
    return message.textElem?.content;
  }
  return undefined;
};

const getBusinessMessageType = (message: MessageItem) => {
  if (message.contentType === MessageType.TextMessage) {
    return undefined;
  }
  return "file";
};

const toFiniteNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
};

const normalizeTargetId = (value?: string | number | null) =>
  String(value ?? "").trim();

const unwrapSendBeforePayload = (response: unknown) => {
  const record =
    response && typeof response === "object"
      ? (response as Record<string, unknown>)
      : {};
  const payload = record.data ?? response;

  return payload && typeof payload === "object"
    ? (payload as Record<string, unknown>)
    : {};
};

const isExplicitFalse = (value: unknown) =>
  value === false || value === 0 || value === "0" || value === "false";

const getSendBeforeReason = (payload: Record<string, unknown>) =>
  String(
    payload.reasonText ??
      payload.errMsg ??
      payload.errorMsg ??
      payload.message ??
      payload.msg ??
      "",
  ).trim();

const assertSendBeforeAllowed = (
  response: unknown,
  keys: Array<"allowed" | "canSend">,
) => {
  const payload = unwrapSendBeforePayload(response);
  const blocked = keys.some(
    (key) =>
      Object.prototype.hasOwnProperty.call(payload, key) &&
      isExplicitFalse(payload[key]),
  );

  if (blocked) {
    throw new Error(getSendBeforeReason(payload) || "当前不允许发送");
  }
};

const getMessageFileSize = (message: MessageItem) => {
  const businessFile = getBusinessFileFromMessageEx(message.ex);
  const businessFileSize = toFiniteNumber(businessFile?.fileSize ?? businessFile?.size);

  if (businessFileSize) {
    return businessFileSize;
  }

  return [
    message.fileElem?.fileSize,
    message.videoElem?.videoSize,
    message.videoElem?.snapshotSize,
    message.pictureElem?.sourcePicture?.size,
    message.pictureElem?.bigPicture?.size,
    message.pictureElem?.snapshotPicture?.size,
  ]
    .map(toFiniteNumber)
    .find((size) => size !== undefined);
};

export function useSendMessage() {
  const sendMessage = useCallback(
    async ({ recvID, groupID, message, needPush }: SendMessageParams) => {
      const { currentConversation, currentGroupInfo } = useConversationStore.getState();
      const normalizedRecvID = normalizeTargetId(recvID ?? currentConversation?.userID);
      const normalizedGroupID = normalizeTargetId(
        groupID ?? currentConversation?.groupID,
      );
      const sourceID = normalizedRecvID || normalizedGroupID;
      const inCurrentConversation =
        isSameID(currentConversation?.userID, sourceID) ||
        isSameID(currentConversation?.groupID, sourceID) ||
        !sourceID;
      needPush = needPush ?? inCurrentConversation;

      const options = {
        recvID: normalizedRecvID,
        groupID: normalizedGroupID,
        message,
      };

      let pushed = false;
      try {
        if (options.groupID) {
          const businessRoomId =
            pickExplicitBusinessRoomId(
              currentGroupInfo as BusinessRecord | undefined,
              options.groupID,
            ) || options.groupID;
          const normalizedRoomId = normalizeTargetId(businessRoomId);
          if (normalizedRoomId) {
            const response = await groupSendBefore({
              roomId: normalizedRoomId,
              messageType: getBusinessMessageType(message),
              contentText: getContentText(message),
              fileSize: getMessageFileSize(message),
            });
            assertSendBeforeAllowed(response, ["canSend", "allowed"]);
          }
        } else if (options.recvID) {
          const response = await singleSendBefore({
            toUserId: normalizedRecvID,
          });
          assertSendBeforeAllowed(response, ["allowed", "canSend"]);
        }

        if (needPush) {
          pushNewMessage(message);
          pushed = true;
          emit("CHAT_LIST_SCROLL_TO_BOTTOM");
        }

        const sendBySdk = getBusinessFileFromMessageEx(message.ex)
          ? IMSDK.sendMessageNotOss
          : IMSDK.sendMessage;
        const { data: successMessage } = await sendBySdk(options);
        updateOneMessage(successMessage);
        return true;
      } catch (error) {
        if (pushed) {
          updateOneMessage({
            ...message,
            status: MessageStatus.Failed,
          });
        }
        feedbackToast({ error });
        return false;
      }
    },
    [],
  );

  return {
    sendMessage,
  };
}
