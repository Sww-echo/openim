import { MessageItem } from "@openim/wasm-client-sdk";
import { Popover, PopoverProps, Upload } from "antd";
import { TooltipPlacement } from "antd/es/tooltip";
import clsx from "clsx";
import i18n, { t } from "i18next";
import { UploadRequestOption } from "rc-upload/lib/interface";
import { memo, ReactNode, useState } from "react";
import React from "react";

import { message as antdMessage, modal } from "@/AntdGlobalComp";
import {
  getBusinessFileFromMessageEx,
  getBusinessFileId,
  invalidateFileReference,
} from "@/api/file";
import { addOpenIMGroupShare } from "@/api/group";
import file from "@/assets/images/chatFooter/file.png";
import image from "@/assets/images/chatFooter/image.png";
import rtc from "@/assets/images/chatFooter/rtc.png";
import video from "@/assets/images/chatFooter/video.png";
import { useConversationStore } from "@/store";
import { BusinessRecord, pickExplicitBusinessRoomId } from "@/utils/businessPayload";
import { feedbackToast } from "@/utils/common";

import { SendMessageParams } from "../useSendMessage";
import CallPopContent from "./CallPopContent";

type UploadActionKey = "image" | "video" | "file";

const getGroupShareFileType = (actionKey: UploadActionKey, file: File) => {
  if (actionKey === "video" || file.type.startsWith("video/")) {
    return 2;
  }
  if (actionKey === "image" || file.type.startsWith("image/")) {
    return 1;
  }
  return 3;
};

const normalizeShareText = (value?: string | number | null) =>
  String(value ?? "").trim();

const normalizeShareSize = (value: unknown) => {
  const size = Number(value);
  return Number.isFinite(size) && size >= 0 ? size : undefined;
};

const getUploadActionTitle = (actionKey: UploadActionKey) => {
  if (actionKey === "image") {
    return t("placeholder.image");
  }
  if (actionKey === "video") {
    return t("placeholder.video");
  }
  return t("placeholder.file");
};

const getUploadLoadingContent = (actionKey: UploadActionKey) => {
  const separator = i18n.language?.startsWith("zh") ? "" : " ";
  return `${getUploadActionTitle(actionKey)}${separator}${t("placeholder.upload")}...`;
};

const syncGroupShareFile = async ({
  actionKey,
  file,
  roomId,
  message,
}: {
  actionKey: UploadActionKey;
  file: File;
  roomId?: string;
  message: MessageItem;
}) => {
  const normalizedRoomId = normalizeShareText(roomId);

  if (!normalizedRoomId || actionKey === "image") {
    return;
  }

  const businessFile = getBusinessFileFromMessageEx(message.ex);
  const businessFileId = getBusinessFileId(businessFile);
  const url = normalizeShareText(
    businessFile?.url ?? businessFile?.downloadUrl ?? businessFile?.previewUrl,
  );
  const name = normalizeShareText(
    businessFile?.fileName ??
      businessFile?.name ??
      businessFile?.originalName ??
      file.name,
  );
  const size = normalizeShareSize(
    businessFile?.fileSize ?? businessFile?.size ?? file.size,
  );

  if (!url || !name || size === undefined) {
    return;
  }

  const shareParams = {
    roomId: normalizedRoomId,
    ...(businessFileId ? { fileId: businessFileId } : {}),
    type: getGroupShareFileType(actionKey, file),
    size,
    url,
    name,
  };

  await addOpenIMGroupShare(shareParams);
};

const sendActionList = [
  {
    title: t("placeholder.image"),
    icon: image,
    key: "image",
    accept: "image/*",
    comp: null,
    placement: undefined,
  },
  {
    title: t("placeholder.video"),
    icon: video,
    key: "video",
    accept: "video/*",
    comp: null,
    placement: undefined,
  },
  {
    title: t("placeholder.file"),
    icon: file,
    key: "file",
    accept: "*/*",
    comp: null,
    placement: undefined,
  },
  {
    title: t("placeholder.call"),
    icon: rtc,
    key: "rtc",
    accept: undefined,
    comp: <CallPopContent />,
    placement: "top",
  },
];

i18n.on("languageChanged", () => {
  sendActionList[0].title = t("placeholder.image");
  sendActionList[1].title = t("placeholder.video");
  sendActionList[2].title = t("placeholder.file");
  sendActionList[3].title = t("placeholder.call");
});

const SendActionBar = ({
  sendMessage,
  getImageMessage,
  getVideoMessage,
  getFileMessage,
  canUploadFile,
}: {
  sendMessage: (params: SendMessageParams) => Promise<boolean>;
  getImageMessage: (file: File) => Promise<MessageItem>;
  getVideoMessage: (file: File) => Promise<MessageItem>;
  getFileMessage: (file: File) => Promise<MessageItem>;
  canUploadFile: boolean;
}) => {
  const [visibleState, setVisibleState] = useState(false);
  const isGroupSession = useConversationStore((state) =>
    Boolean(state.currentConversation?.groupID),
  );

  const closePop = () => setVisibleState(false);

  const getMessageByAction = (actionKey: UploadActionKey, file: File) => {
    if (actionKey === "image") {
      return getImageMessage(file);
    }
    if (actionKey === "video") {
      return getVideoMessage(file);
    }
    return getFileMessage(file);
  };

  const runFileHandle = async (
    options: UploadRequestOption,
    actionKey: UploadActionKey,
  ) => {
    const loadingKey = `chat-upload-${actionKey}-${Date.now()}-${Math.random()}`;
    try {
      antdMessage.loading({
        key: loadingKey,
        content: getUploadLoadingContent(actionKey),
        duration: 0,
      });
      const uploadFile = options.file as File;
      const message = await getMessageByAction(actionKey, uploadFile);
      options.onSuccess?.(message);
      const didStartSend = await sendMessage({
        message,
      });
      const businessFileId = getBusinessFileId(
        getBusinessFileFromMessageEx(message.ex),
      );

      if (!didStartSend && businessFileId) {
        void invalidateFileReference({
          fileId: businessFileId,
          reason: "message_destroy",
        }).catch((error) => {
          console.warn("Failed to invalidate rejected business file reference", error);
        });
      }
      if (didStartSend) {
        const { currentConversation, currentGroupInfo } =
          useConversationStore.getState();
        const roomId =
          pickExplicitBusinessRoomId(
            currentGroupInfo as BusinessRecord | undefined,
            currentConversation?.groupID,
          ) || currentConversation?.groupID;

        void syncGroupShareFile({
          actionKey,
          file: uploadFile,
          roomId,
          message,
        }).catch((error) => {
          console.warn("Failed to sync group shared file", error);
        });
      }
    } catch (error) {
      options.onError?.(error as Error);
      feedbackToast({ error });
    } finally {
      antdMessage.destroy(loadingKey);
    }
  };

  const fileHandle = (options: UploadRequestOption, actionKey: UploadActionKey) => {
    if (actionKey !== "video") {
      void runFileHandle(options, actionKey);
      return;
    }

    modal.confirm({
      title: t("placeholder.send"),
      content: t("placeholder.confirmUploadAndSendFile"),
      onOk: () => {
        void runFileHandle(options, actionKey);
      },
      onCancel: () => options.onError?.(new Error("Upload canceled")),
    });
  };

  return (
    <div className="flex items-center px-4.5 pt-2">
      {sendActionList.map((action) => {
        if (action.key === "rtc" && isGroupSession) {
          return null;
        }
        if (!canUploadFile && action.accept) {
          return null;
        }
        const popProps: PopoverProps = {
          placement: action.placement as TooltipPlacement,
          content:
            action.comp &&
            React.cloneElement(action.comp as React.ReactElement, {
              closePop,
            }),
          title: null,
          arrow: false,
          trigger: "click",
          // @ts-ignore
          open: action.comp ? visibleState : false,
          onOpenChange: (visible) => setVisibleState(visible),
        };

        return (
          <ActionWrap
            popProps={popProps}
            key={action.key}
            accept={action.accept}
            actionKey={action.key as UploadActionKey}
            fileHandle={fileHandle}
          >
            <div
              className={clsx("flex cursor-pointer items-center last:mr-0", {
                "mr-5": !action.accept,
              })}
            >
              <img src={action.icon} width={20} alt={action.title} />
            </div>
          </ActionWrap>
        );
      })}
    </div>
  );
};

export default memo(SendActionBar);

const ActionWrap = ({
  accept,
  popProps,
  children,
  fileHandle,
  actionKey,
}: {
  accept?: string;
  children: ReactNode;
  popProps?: PopoverProps;
  actionKey: UploadActionKey;
  fileHandle: (options: UploadRequestOption, actionKey: UploadActionKey) => void;
}) => {
  return accept ? (
    <Upload
      showUploadList={false}
      customRequest={(options) => fileHandle(options, actionKey)}
      accept={accept}
      multiple
      className="mr-5 flex"
    >
      {children}
    </Upload>
  ) : (
    <Popover {...popProps}>{children}</Popover>
  );
};
