import { RightOutlined } from "@ant-design/icons";
import { MessageReceiveOptType } from "@openim/wasm-client-sdk";
import { Button, Divider, Drawer, Select } from "antd";
import { t } from "i18next";
import { forwardRef, ForwardRefRenderFunction, memo } from "react";

import { modal } from "@/AntdGlobalComp";
import {
  addBusinessBlacklist,
  deleteBusinessBlacklist,
  deleteBusinessFriend,
  updateFriendProperties,
  updateFriendSettings,
} from "@/api/friend";
import OIMAvatar from "@/components/OIMAvatar";
import SettingRow from "@/components/SettingRow";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { IMSDK } from "@/layout/MainContentWrap";
import { useContactStore, useConversationStore } from "@/store";
import { feedbackToast, isSameID } from "@/utils/common";
import { emit } from "@/utils/events";

// export interface SingleSettingProps {}

const toBinarySwitch = (checked: boolean) => (checked ? 1 : 0);

const normalizeTargetUserID = (userID?: string | number | null) =>
  String(userID ?? "").trim();

const normalizeChatRecordTimeOut = (value?: string | number) => {
  const text = String(value ?? "-1.0");

  if (text === "0" || text === "-1") {
    return "-1.0";
  }
  if (/^\d+$/.test(text)) {
    return `${text}.0`;
  }
  return text;
};

const SingleSetting: ForwardRefRenderFunction<OverlayVisibleHandle, unknown> = (
  _,
  ref,
) => {
  const currentConversation = useConversationStore(
    (state) => state.currentConversation,
  );
  const updateCurrentConversation = useConversationStore(
    (state) => state.updateCurrentConversation,
  );

  const isBlack = useContactStore((state) => state.blackList).some(
    (black) => isSameID(currentConversation?.userID, black.userID),
  );
  const isFriend = useContactStore((state) => state.friendList).some(
    (friend) => isSameID(currentConversation?.userID, friend.userID),
  );

  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);
  const noPushEnabled =
    currentConversation?.recvMsgOpt !== undefined &&
    currentConversation.recvMsgOpt !== MessageReceiveOptType.Normal;
  const targetUserID = normalizeTargetUserID(currentConversation?.userID);
  const topEnabled = Boolean(currentConversation?.isPinned);
  const currentConversationWithBusinessFields = currentConversation as
    | (typeof currentConversation & {
        chatRecordTimeOut?: string | number;
      })
    | undefined;
  const chatRecordTimeOutValue = normalizeChatRecordTimeOut(
    currentConversationWithBusinessFields?.chatRecordTimeOut,
  );
  const chatRecordTimeOutOptions = [
    { value: "-1.0", label: t("close") },
    { value: "1.0", label: t("date.day", { num: 1 }) },
    { value: "7.0", label: t("date.day", { num: 7 }) },
    { value: "30.0", label: t("date.day", { num: 30 }) },
    { value: "90.0", label: t("date.day", { num: 90 }) },
    { value: "365.0", label: t("date.day", { num: 365 }) },
  ];

  const confirmUpdateSingleSetting = (onOk: () => Promise<void>) => {
    modal.confirm({
      title: t("placeholder.save"),
      content: t("placeholder.confirmUpdateSingleSetting"),
      onOk,
    });
  };

  const updateSingleNoPush = async (checked: boolean) => {
    if (!currentConversation) return;
    if (!targetUserID) {
      feedbackToast({
        error: new Error(t("toast.updateConversationPrivateStateFailed")),
      });
      return;
    }

    confirmUpdateSingleSetting(async () => {
      try {
        const nextOpt = checked
          ? MessageReceiveOptType.NotNotify
          : MessageReceiveOptType.Normal;

        await updateFriendSettings(targetUserID, {
          type: 0,
          offlineNoPushMsg: toBinarySwitch(checked),
        });
        await IMSDK.setConversationRecvMessageOpt({
          conversationID: currentConversation.conversationID,
          opt: nextOpt,
        });
        await updateCurrentConversation({
          ...currentConversation,
          recvMsgOpt: nextOpt,
        });
        feedbackToast();
      } catch (error) {
        feedbackToast({ error });
      }
    });
  };

  const updateSingleTop = async (checked: boolean) => {
    if (!currentConversation) return;
    if (!targetUserID) {
      feedbackToast({ error: new Error(t("toast.pinConversationFailed")) });
      return;
    }

    confirmUpdateSingleSetting(async () => {
      try {
        await updateFriendSettings(targetUserID, {
          type: 2,
          offlineNoPushMsg: toBinarySwitch(checked),
        });
        await IMSDK.pinConversation({
          conversationID: currentConversation.conversationID,
          isPinned: checked,
        });
        await updateCurrentConversation({
          ...currentConversation,
          isPinned: checked,
        });
        feedbackToast();
      } catch (error) {
        feedbackToast({ error });
      }
    });
  };

  const updateSingleChatRecordTimeOut = async (chatRecordTimeOut: string) => {
    if (!currentConversation) return;
    if (!targetUserID) {
      feedbackToast({
        error: new Error(t("toast.updateConversationPrivateStateFailed")),
      });
      return;
    }

    confirmUpdateSingleSetting(async () => {
      try {
        await updateFriendProperties(targetUserID, {
          chatRecordTimeOut,
        });
        await updateCurrentConversation({
          ...currentConversation,
          chatRecordTimeOut,
        } as typeof currentConversation);
        feedbackToast();
      } catch (error) {
        feedbackToast({ error });
      }
    });
  };

  const updateBlack = async () => {
    if (!currentConversation) return;
    if (!targetUserID) {
      feedbackToast({ error: new Error(t("toast.updateBlackStateFailed")) });
      return;
    }

    const execFunc = async () => {
      try {
        if (isBlack) {
          await deleteBusinessBlacklist(targetUserID);
          await IMSDK.removeBlack(targetUserID);
        } else {
          await addBusinessBlacklist(targetUserID);
          await IMSDK.addBlack({
            toUserID: targetUserID,
          });
        }
      } catch (error) {
        feedbackToast({ error, msg: t("toast.updateBlackStateFailed") });
      }
    };
    modal.confirm({
      title: isBlack ? t("placeholder.remove") : t("placeholder.moveBlacklist"),
      content: isBlack ? (
        t("toast.confirmRemoveBlacklist")
      ) : (
        <div className="flex items-baseline">
          <div>{t("toast.confirmMoveBlacklist")}</div>
          <span className="text-xs text-[var(--sub-text)]">
            {t("placeholder.willFilterThisUserMessage")}
          </span>
        </div>
      ),
      onOk: execFunc,
    });
  };

  const tryUnfriend = () => {
    if (!currentConversation) return;
    if (!targetUserID) {
      feedbackToast({ error: new Error(t("toast.unfriendFailed")) });
      return;
    }

    modal.confirm({
      title: t("placeholder.unfriend"),
      content: t("toast.confirmUnfriend"),
      onOk: async () => {
        try {
          await deleteBusinessFriend(targetUserID);
          await IMSDK.deleteFriend(targetUserID);
        } catch (error) {
          feedbackToast({ error, msg: t("toast.unfriendFailed") });
        }
      },
    });
  };

  const openUserCard = () => {
    emit("OPEN_USER_CARD", { userID: currentConversation?.userID });
  };

  return (
    <Drawer
      title={t("placeholder.setting")}
      placement="right"
      rootClassName="chat-drawer"
      destroyOnClose
      onClose={closeOverlay}
      open={isOverlayOpen}
      maskClassName="opacity-0"
      maskMotion={{
        visible: false,
      }}
      width={450}
      getContainer={"#chat-container"}
    >
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={openUserCard}
      >
        <div className="flex items-center">
          <OIMAvatar
            src={currentConversation?.faceURL}
            text={currentConversation?.showName}
          />
          <div className="ml-3">{currentConversation?.showName}</div>
        </div>
        <RightOutlined rev={undefined} />
      </div>
      <Divider className="m-0 border-4 border-[#F4F5F7]" />
      <SettingRow
        title={t("placeholder.shieldConversation")}
        value={noPushEnabled}
        tryChange={updateSingleNoPush}
      />
      <SettingRow
        title={t("placeholder.sticky")}
        value={topEnabled}
        tryChange={updateSingleTop}
      />
      <SettingRow title={t("placeholder.messageDestruct")}>
        <Select
          className="w-28"
          size="small"
          value={chatRecordTimeOutValue}
          options={chatRecordTimeOutOptions}
          onChange={updateSingleChatRecordTimeOut}
        />
      </SettingRow>
      <Divider className="m-0 border-4 border-[#F4F5F7]" />
      <SettingRow
        title={t("placeholder.moveBlacklist")}
        value={isBlack}
        tryChange={updateBlack}
      />
      <Divider className="m-0 border-4 border-[#F4F5F7]" />

      <div className="flex-1" />
      {isFriend && (
        <div className="flex w-full justify-center pb-3 pt-24">
          <Button type="primary" danger onClick={tryUnfriend}>
            {t("placeholder.unfriend")}
          </Button>
        </div>
      )}
    </Drawer>
  );
};

export default memo(forwardRef(SingleSetting));
