import {
  MessageItem as MessageItemType,
  MessageStatus,
  MessageType,
} from "@openim/wasm-client-sdk";
import { Dropdown, Empty, List, type MenuProps } from "antd";
import clsx from "clsx";
import { t } from "i18next";
import { FC, memo, useCallback, useRef, useState } from "react";

import { modal } from "@/AntdGlobalComp";
import { addFavoriteMessage, recallGroupMessage } from "@/api/chat";
import {
  getBusinessFileFromMessageEx,
  getBusinessFileId,
  invalidateFileReference,
  triggerBusinessFileDownload,
} from "@/api/file";
import { getOpenIMMessageReadDetail } from "@/api/group";
import OIMAvatar from "@/components/OIMAvatar";
import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore } from "@/store";
import {
  BusinessRecord,
  getBusinessListPayload,
  isBusinessRecord,
  pickBusinessAuditId,
  pickExplicitBusinessRoomId,
  pickBusinessText,
  unwrapBusinessPayload,
} from "@/utils/businessPayload";
import { downloadFile, feedbackToast } from "@/utils/common";
import { emit } from "@/utils/events";
import { formatMessageTime } from "@/utils/imCommon";

import { deleteOneMessage } from "../useHistoryMessageList";
import CatchMessageRender from "./CatchMsgRenderer";
import FileMessageRender from "./FileMessageRender";
import MediaMessageRender from "./MediaMessageRender";
import styles from "./message-item.module.scss";
import MessageItemErrorBoundary from "./MessageItemErrorBoundary";
import MessageSuffix from "./MessageSuffix";
import TextMessageRender from "./TextMessageRender";
import VideoMessageRender from "./VideoMessageRender";

export interface IMessageItemProps {
  message: MessageItemType;
  isSender: boolean;
  disabled?: boolean;
  conversationID?: string;
  messageUpdateFlag?: string;
}

const components: Record<number, FC<IMessageItemProps>> = {
  [MessageType.TextMessage]: TextMessageRender,
  [MessageType.PictureMessage]: MediaMessageRender,
  [MessageType.VideoMessage]: VideoMessageRender,
  [MessageType.FileMessage]: FileMessageRender,
};

const attachmentMessageTypes = [
  MessageType.PictureMessage,
  MessageType.VideoMessage,
  MessageType.FileMessage,
];

const readDetailReadListKeys = [
  "readList",
  "readUsers",
  "readMembers",
  "hasReadUsers",
  "hasReadMembers",
  "read",
];
const readDetailUnreadListKeys = [
  "unreadList",
  "unreadUsers",
  "unreadMembers",
  "notReadUsers",
  "notReadMembers",
  "unread",
];
const readDetailReadCountKeys = ["readCount", "hasReadCount", "readNum"];
const readDetailUnreadCountKeys = ["unreadCount", "notReadCount", "unreadNum"];

const normalizeMessageText = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const getMessageSeqParam = (value: unknown) => {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && !value.trim())
  ) {
    return undefined;
  }

  const seq = Number(value);
  return Number.isFinite(seq) ? seq : undefined;
};

const getMessageLocator = (message: MessageItemType) => ({
  clientMsgID: normalizeMessageText(message.clientMsgID) || undefined,
  serverMsgID: normalizeMessageText(message.serverMsgID) || undefined,
  seq: getMessageSeqParam(message.seq),
});

const hasMessageLocator = (locator: ReturnType<typeof getMessageLocator>) =>
  Boolean(locator.clientMsgID || locator.serverMsgID || locator.seq !== undefined);

const getReadDetailRecord = (response: unknown) => {
  const payload = unwrapBusinessPayload(response);
  return isBusinessRecord(payload) ? payload : {};
};

const getReadDetailList = (response: unknown, keys: string[]) => {
  const record = getReadDetailRecord(response);

  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter(isBusinessRecord);
    }

    const list = getBusinessListPayload(value);
    if (list.length > 0) {
      return list;
    }
  }

  return [];
};

const getReadDetailCount = (response: unknown, keys: string[], fallback: number) => {
  const record = getReadDetailRecord(response);
  const value = keys
    .map((key) => record[key])
    .find((item) => typeof item === "number" || typeof item === "string");
  const count = Number(value);

  return Number.isFinite(count) ? count : fallback;
};

const getReadDetailMemberName = (record: BusinessRecord) =>
  pickBusinessText(record, [
    "nickname",
    "nickName",
    "userName",
    "name",
    "account",
    "userId",
    "userID",
  ]) || "-";

const getReadDetailMemberId = (record: BusinessRecord) =>
  pickBusinessText(record, ["userID", "userId", "memberId", "account"]);

const getReadDetailMemberFaceURL = (record: BusinessRecord) =>
  pickBusinessText(record, ["faceURL", "faceUrl", "avatar", "avatarUrl"]);

const renderReadDetailMemberList = (items: BusinessRecord[]) => (
  <List
    size="small"
    dataSource={items}
    locale={{ emptyText: <Empty description={t("empty.noSearchResults")} /> }}
    renderItem={(item) => (
      <List.Item>
        <List.Item.Meta
          avatar={
            <OIMAvatar
              src={getReadDetailMemberFaceURL(item)}
              text={getReadDetailMemberName(item)}
            />
          }
          title={getReadDetailMemberName(item)}
          description={getReadDetailMemberId(item)}
        />
      </List.Item>
    )}
  />
);

const renderReadDetailContent = (response: unknown) => {
  const readList = getReadDetailList(response, readDetailReadListKeys);
  const unreadList = getReadDetailList(response, readDetailUnreadListKeys);
  const readCount = getReadDetailCount(
    response,
    readDetailReadCountKeys,
    readList.length,
  );
  const unreadCount = getReadDetailCount(
    response,
    readDetailUnreadCountKeys,
    unreadList.length,
  );

  if (readList.length === 0 && unreadList.length === 0) {
    return (
      <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap text-xs">
        {JSON.stringify(response, null, 2)}
      </pre>
    );
  }

  return (
    <div className="max-h-[420px] overflow-auto">
      <div className="mb-3 flex gap-4 text-sm text-[var(--sub-text)]">
        <span>{t("placeholder.isReadNum", { num: readCount })}</span>
        <span>{t("placeholder.unreadNum", { num: unreadCount })}</span>
      </div>
      <div className="mb-3">
        <div className="mb-2 font-medium">{t("placeholder.isRead")}</div>
        {renderReadDetailMemberList(readList)}
      </div>
      <div>
        <div className="mb-2 font-medium">{t("placeholder.unread")}</div>
        {renderReadDetailMemberList(unreadList)}
      </div>
    </div>
  );
};

const MessageItem: FC<IMessageItemProps> = ({
  message,
  disabled,
  isSender,
  conversationID,
}) => {
  const messageWrapRef = useRef<HTMLDivElement>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const MessageRenderComponent = components[message.contentType] || CatchMessageRender;
  const canDownloadAttachment = attachmentMessageTypes.includes(message.contentType);
  const currentGroupInfo = useConversationStore((state) => state.currentGroupInfo);
  const messageGroupID = normalizeMessageText(message.groupID);
  const businessRoomId = normalizeMessageText(
    pickExplicitBusinessRoomId(
      currentGroupInfo as BusinessRecord | undefined,
      messageGroupID,
    ) || messageGroupID,
  );

  const closeMessageMenu = useCallback(() => {
    setShowMessageMenu(false);
  }, []);

  const invalidateBusinessFile = useCallback(() => {
    const fileId = getBusinessFileId(getBusinessFileFromMessageEx(message.ex));

    if (!fileId) {
      return;
    }
    void invalidateFileReference({
      fileId,
      reason: "message_withdraw",
    }).catch((error) => {
      console.warn("Failed to invalidate business file reference", error);
    });
  }, [message.ex]);

  const copyMessage = useCallback(async () => {
    const content = message.textElem?.content;

    if (!content) {
      return;
    }
    await navigator.clipboard.writeText(content);
    feedbackToast({ msg: t("toast.copySuccess") });
  }, [message.textElem?.content]);

  const favoriteMessage = useCallback(async () => {
    const auditId = normalizeMessageText(pickBusinessAuditId(message));
    const messageLocator = getMessageLocator(message);

    if (!auditId && !hasMessageLocator(messageLocator)) {
      throw new Error(t("toast.accessFailed"));
    }

    await addFavoriteMessage({
      auditId: auditId || undefined,
      roomId: businessRoomId || undefined,
      ...messageLocator,
    });
    feedbackToast();
  }, [businessRoomId, message]);

  const confirmFavoriteMessage = useCallback(() => {
    modal.confirm({
      title: t("placeholder.favorite"),
      content: t("placeholder.confirmFavoriteMessage"),
      onOk: async () => {
        try {
          await favoriteMessage();
        } catch (error) {
          feedbackToast({ error });
        }
      },
    });
  }, [favoriteMessage]);

  const forwardMessage = useCallback(() => {
    emit("OPEN_CHOOSE_MODAL", {
      type: "FORWARD_MESSAGE",
      extraData: {
        message,
      },
    });
  }, [message]);

  const downloadAttachment = useCallback(async () => {
    const businessFile = getBusinessFileFromMessageEx(message.ex);
    const businessFileId = getBusinessFileId(businessFile);
    const fileName =
      message.fileElem?.fileName ??
      businessFile?.fileName ??
      businessFile?.name ??
      undefined;
    const sourceUrl =
      message.fileElem?.sourceUrl ??
      message.videoElem?.videoUrl ??
      message.pictureElem?.sourcePicture.url ??
      message.pictureElem?.snapshotPicture?.url;

    if (businessFileId) {
      await triggerBusinessFileDownload(businessFileId, fileName);
      return;
    }
    if (sourceUrl) {
      await downloadFile(sourceUrl);
      return;
    }
    throw new Error(t("toast.downloadFailed"));
  }, [
    message.ex,
    message.fileElem?.fileName,
    message.fileElem?.sourceUrl,
    message.pictureElem?.snapshotPicture?.url,
    message.pictureElem?.sourcePicture.url,
    message.videoElem?.videoUrl,
  ]);

  const confirmDownloadAttachment = useCallback(() => {
    modal.confirm({
      title: t("placeholder.download"),
      content: t("placeholder.confirmDownloadFile"),
      onOk: async () => {
        try {
          await downloadAttachment();
        } catch (error) {
          feedbackToast({ error });
        }
      },
    });
  }, [downloadAttachment]);

  const revokeMessage = useCallback(async () => {
    const clientMsgID = normalizeMessageText(message.clientMsgID);
    const messageLocator = getMessageLocator(message);

    if (!conversationID || !messageGroupID || !clientMsgID) {
      throw new Error(t("toast.accessFailed"));
    }

    if (businessRoomId && hasMessageLocator(messageLocator)) {
      await recallGroupMessage({
        roomId: businessRoomId,
        ...messageLocator,
      });
    }
    await IMSDK.revokeMessage({
      conversationID,
      clientMsgID,
    });
    invalidateBusinessFile();
  }, [
    conversationID,
    businessRoomId,
    invalidateBusinessFile,
    message.clientMsgID,
    message.seq,
    message.serverMsgID,
    messageGroupID,
  ]);

  const confirmRevokeMessage = useCallback(() => {
    modal.confirm({
      title: t("placeholder.revoke"),
      content: t("placeholder.confirmRevokeMessage"),
      onOk: async () => {
        try {
          await revokeMessage();
          feedbackToast();
        } catch (error) {
          feedbackToast({ error });
        }
      },
    });
  }, [revokeMessage]);

  const deleteLocalMessage = useCallback(async () => {
    const clientMsgID = normalizeMessageText(message.clientMsgID);

    if (!conversationID || !clientMsgID) {
      throw new Error(t("toast.accessFailed"));
    }

    await IMSDK.deleteMessageFromLocalStorage({
      conversationID,
      clientMsgID,
    });
    deleteOneMessage(clientMsgID);
    feedbackToast();
  }, [conversationID, message.clientMsgID]);

  const confirmDeleteLocalMessage = useCallback(() => {
    modal.confirm({
      title: t("placeholder.delete"),
      content: t("placeholder.confirmDeleteMessage"),
      onOk: async () => {
        try {
          await deleteLocalMessage();
        } catch (error) {
          feedbackToast({ error });
        }
      },
    });
  }, [deleteLocalMessage]);

  const showReadDetail = useCallback(async () => {
    if (!messageGroupID) {
      return;
    }
    const messageLocator = getMessageLocator(message);
    if (!businessRoomId || !hasMessageLocator(messageLocator)) {
      modal.info({
        title: t("placeholder.isReadList"),
        width: 520,
        content: <Empty description={t("empty.noSearchResults")} />,
      });
      return;
    }

    try {
      const response = await getOpenIMMessageReadDetail({
        roomId: businessRoomId,
        ...messageLocator,
      });

      modal.info({
        title: t("placeholder.isReadList"),
        width: 520,
        content: renderReadDetailContent(response),
      });
    } catch (error) {
      console.debug("Failed to load message read detail", error);
      modal.info({
        title: t("placeholder.isReadList"),
        width: 520,
        content: <Empty description={t("empty.noSearchResults")} />,
      });
    }
  }, [
    businessRoomId,
    message.clientMsgID,
    message.seq,
    message.serverMsgID,
    messageGroupID,
  ]);

  const handleMessageMenuAction = useCallback(
    async (key: string) => {
      try {
        if (key === "copy") {
          await copyMessage();
        }
        if (key === "favorite") {
          confirmFavoriteMessage();
        }
        if (key === "forward") {
          forwardMessage();
        }
        if (key === "download") {
          confirmDownloadAttachment();
        }
        if (key === "revoke") {
          confirmRevokeMessage();
        }
        if (key === "delete") {
          confirmDeleteLocalMessage();
        }
        if (key === "readDetail") {
          await showReadDetail();
        }
      } catch (error) {
        feedbackToast({ error });
      } finally {
        closeMessageMenu();
      }
    },
    [
      closeMessageMenu,
      confirmDownloadAttachment,
      confirmDeleteLocalMessage,
      confirmFavoriteMessage,
      confirmRevokeMessage,
      copyMessage,
      forwardMessage,
      showReadDetail,
    ],
  );

  const menuItems: MenuProps["items"] = [
    message.contentType === MessageType.TextMessage && {
      key: "copy",
      label: t("placeholder.copy"),
    },
    {
      key: "forward",
      label: t("placeholder.forward"),
    },
    {
      key: "favorite",
      label: t("placeholder.favorite"),
    },
    canDownloadAttachment && {
      key: "download",
      label: t("placeholder.download"),
    },
    messageGroupID && {
      key: "readDetail",
      label: t("placeholder.isReadList"),
    },
    messageGroupID &&
      isSender && {
        key: "revoke",
        label: t("placeholder.revoke"),
      },
    {
      key: "delete",
      danger: true,
      label: t("placeholder.delete"),
    },
  ].filter(Boolean) as MenuProps["items"];

  const handleMenuClick: MenuProps["onClick"] = ({ domEvent, key }) => {
    domEvent.stopPropagation();
    void handleMessageMenuAction(key);
  };

  const canShowMessageMenu = !disabled && message.status !== MessageStatus.Sending;
  const messageNode = (
    <div
      id={`chat_${message.clientMsgID}`}
      className={clsx("relative flex select-text px-5 py-3")}
    >
      <div
        className={clsx(
          styles["message-container"],
          isSender && styles["message-container-sender"],
        )}
      >
        <OIMAvatar
          size={36}
          src={message.senderFaceUrl}
          text={message.senderNickname}
        />

        <div className={styles["message-wrap"]} ref={messageWrapRef}>
          <div className={styles["message-profile"]}>
            <div
              title={message.senderNickname}
              className={clsx(
                "max-w-[30%] truncate text-[var(--sub-text)]",
                isSender ? "ml-2" : "mr-2",
              )}
            >
              {message.senderNickname}
            </div>
            <div className="text-[var(--sub-text)]">
              {formatMessageTime(message.sendTime)}
            </div>
          </div>

          <div className={styles["menu-wrap"]}>
            <MessageItemErrorBoundary message={message}>
              <MessageRenderComponent
                message={message}
                isSender={isSender}
                disabled={disabled}
              />
            </MessageItemErrorBoundary>

            <MessageSuffix
              message={message}
              isSender={isSender}
              disabled={false}
              conversationID={conversationID}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return canShowMessageMenu ? (
    <Dropdown
      trigger={["contextMenu"]}
      open={showMessageMenu}
      onOpenChange={setShowMessageMenu}
      menu={{
        items: menuItems,
        onClick: handleMenuClick,
      }}
    >
      {messageNode}
    </Dropdown>
  ) : (
    messageNode
  );
};

export default memo(MessageItem);
