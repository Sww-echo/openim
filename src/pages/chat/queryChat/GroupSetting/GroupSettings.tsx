import { RightOutlined } from "@ant-design/icons";
import {
  AllowType,
  GroupVerificationType,
  MessageReceiveOptType,
  MessageType,
} from "@openim/wasm-client-sdk";
import { Button, Divider, Input, InputNumber, Select, Space, Upload } from "antd";
import clsx from "clsx";
import { t } from "i18next";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useCopyToClipboard } from "react-use";

import { modal } from "@/AntdGlobalComp";
import {
  clearOpenIMGroupMessages,
  type RoomSettingsParams,
  setOpenIMGroupOfflineNoPush,
  setOpenIMGroupTop,
} from "@/api/group";
import { reportBusinessTarget, ReportTargetType } from "@/api/report";
import copy from "@/assets/images/chatSetting/copy.png";
import edit_avatar from "@/assets/images/chatSetting/edit_avatar.png";
import EditableContent from "@/components/EditableContent";
import OIMAvatar from "@/components/OIMAvatar";
import SettingRow from "@/components/SettingRow";
import { useCurrentMemberRole } from "@/hooks/useCurrentMemberRole";
import { IMSDK } from "@/layout/MainContentWrap";
import type { GroupChooseExtraData } from "@/pages/common/ChooseModal";
import { useConversationStore } from "@/store";
import {
  BusinessRecord,
  pickExplicitBusinessRoomId,
  toBusinessText,
} from "@/utils/businessPayload";
import type { BusinessSwitchValue } from "@/utils/businessSwitch";
import { isBusinessSwitchOn } from "@/utils/businessSwitch";
import { feedbackToast } from "@/utils/common";
import { emit } from "@/utils/events";
import { uploadFile } from "@/utils/imCommon";

import { FileWithPath } from "../ChatFooter/SendActionBar/useFileMessage";
import { clearMessageList } from "../useHistoryMessageList";
import GroupBusinessEntrances from "./GroupBusinessEntrances";
import GroupMemberRow from "./GroupMemberRow";
import { useGroupSettings } from "./useGroupSettings";

type BusinessSwitchField =
  | "allowConference"
  | "allowAddFriend"
  | "allowAtAll"
  | "allowCreateNotice"
  | "allowEditNickname"
  | "allowMemberPrivateChat"
  | "allowInviteFriend"
  | "allowQuitRoom"
  | "allowShareQR"
  | "allowSpeakCourse"
  | "allowSendCard"
  | "allowUploadFile"
  | "burnAfterReadNoticeEnabled"
  | "burnAfterReadEnabled"
  | "isNeedVerify"
  | "limitSendSmg"
  | "messageDestroyNoticeEnabled"
  | "messageDestroyEnabled"
  | "searchable"
  | "showMember"
  | "showOnlineStatus"
  | "showRead";

type BusinessNumberField =
  | "burnAfterReadSeconds"
  | "messageDestroyDays"
  | "withdrawTime";

type BusinessGroupInfo = Partial<
  Record<BusinessSwitchField | BusinessNumberField, boolean | number | null> & {
    chatRecordTimeOut?: string | number | null;
    joinMethod?: boolean | number | null;
    myMember?: {
      offlineNoPushMsg?: BusinessSwitchValue;
      top?: BusinessSwitchValue;
    };
    messageDestroyContentTypes?: string | number | null;
  }
>;

interface NumberSettingRowProps {
  disabled?: boolean;
  max: number;
  min: number;
  title: string;
  unit: string;
  value?: number;
  onSave: (value: number) => void;
}

const toBinarySwitch = (checked: boolean) => (checked ? 1 : 0);

const getBusinessNumber = (value: boolean | number | null | undefined) => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
};

const getBusinessInteger = (
  value: boolean | number | null | undefined,
  fallback: number,
) => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const getOptionalBusinessSwitch = (value: BusinessSwitchValue, fallback: boolean) =>
  value === undefined || value === null
    ? fallback
    : isBusinessSwitchOn(value, fallback);

const normalizeChatRecordTimeOut = (value?: string | number | null) => {
  const text = String(value ?? "-1.0");

  if (text === "0" || text === "-1") {
    return "-1.0";
  }
  if (/^\d+$/.test(text)) {
    return `${text}.0`;
  }
  return text;
};

const messageDestroyContentTypeConfig: Array<{
  labelKey: string;
  value: number;
}> = [
  {
    labelKey: "placeholder.messageTypeText",
    value: MessageType.TextMessage,
  },
  {
    labelKey: "placeholder.messageTypePicture",
    value: MessageType.PictureMessage,
  },
  {
    labelKey: "placeholder.messageTypeVoice",
    value: MessageType.VoiceMessage,
  },
  {
    labelKey: "placeholder.messageTypeVideo",
    value: MessageType.VideoMessage,
  },
  {
    labelKey: "placeholder.messageTypeFile",
    value: MessageType.FileMessage,
  },
  {
    labelKey: "placeholder.messageTypeAtText",
    value: MessageType.AtTextMessage,
  },
  {
    labelKey: "placeholder.messageTypeMerge",
    value: MessageType.MergeMessage,
  },
  {
    labelKey: "placeholder.messageTypeCard",
    value: MessageType.CardMessage,
  },
  {
    labelKey: "placeholder.messageTypeLocation",
    value: MessageType.LocationMessage,
  },
  {
    labelKey: "placeholder.messageTypeCustom",
    value: MessageType.CustomMessage,
  },
];

const allMessageDestroyContentTypes: number[] = messageDestroyContentTypeConfig.map(
  ({ value }) => value,
);

const normalizeMessageDestroyContentTypes = (value?: string | number | null) => {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return allMessageDestroyContentTypes;
  }

  const selectedValues = rawValue
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => allMessageDestroyContentTypes.includes(item));

  return selectedValues.length
    ? Array.from(new Set(selectedValues))
    : allMessageDestroyContentTypes;
};

const NumberSettingRow = memo(
  ({ disabled, max, min, title, unit, value, onSave }: NumberSettingRowProps) => {
    const [draft, setDraft] = useState<number | null>(value ?? null);

    useEffect(() => {
      setDraft(value ?? null);
    }, [value]);

    return (
      <SettingRow title={title}>
        <Space size={8}>
          <InputNumber
            className="w-24"
            size="small"
            min={min}
            max={max}
            disabled={disabled}
            value={draft}
            addonAfter={unit}
            onChange={(nextValue) =>
              setDraft(typeof nextValue === "number" ? nextValue : null)
            }
          />
          <Button
            size="small"
            type="primary"
            disabled={disabled || draft === null}
            onClick={() => {
              if (draft !== null) {
                onSave(draft);
              }
            }}
          >
            {t("placeholder.save")}
          </Button>
        </Space>
      </SettingRow>
    );
  },
);

const GroupSettings = ({
  updateTravel,
  closeOverlay,
}: {
  updateTravel: () => void;
  closeOverlay: () => void;
}) => {
  const { isNomal, isOwner, isAdmin, isJoinGroup } = useCurrentMemberRole();
  const currentConversation = useConversationStore(
    (state) => state.currentConversation,
  );
  const updateCurrentConversation = useConversationStore(
    (state) => state.updateCurrentConversation,
  );
  const updateCurrentGroupInfo = useConversationStore(
    (state) => state.updateCurrentGroupInfo,
  );

  const {
    currentGroupInfo,
    updateGroupInfo,
    updateRoomSettings,
    updateGroupPermission,
    tryQuitGroup,
    tryDismissGroup,
  } = useGroupSettings({ closeOverlay });

  const [_, copyToClipboard] = useCopyToClipboard();
  const [allMutedOverride, setAllMutedOverride] = useState<boolean>();
  const businessGroupInfo = currentGroupInfo as BusinessGroupInfo | undefined;
  const fallbackGroupID = toBusinessText(
    currentConversation?.groupID ?? currentGroupInfo?.groupID,
  ).trim();
  const businessRoomId = (
    pickExplicitBusinessRoomId(
      currentGroupInfo as BusinessRecord | undefined,
      fallbackGroupID,
    ) || fallbackGroupID
  ).trim();

  const confirmUpdateGroupSetting = useCallback((action: () => Promise<void>) => {
    modal.confirm({
      title: t("placeholder.save"),
      content: t("placeholder.confirmUpdateGroupSetting"),
      onOk: action,
    });
  }, []);

  const customUpload = ({ file }: { file: FileWithPath }) => {
    modal.confirm({
      title: t("placeholder.upload"),
      content: t("placeholder.confirmUploadFile"),
      onOk: async () => {
        try {
          const {
            data: { url },
          } = await uploadFile(file);
          await updateGroupInfo({ faceURL: url });
        } catch (error) {
          feedbackToast({ error: t("toast.updateAvatarFailed") });
        }
      },
    });
  };

  const updateGroupName = useCallback(
    (groupName: string) => {
      confirmUpdateGroupSetting(() => updateGroupInfo({ groupName }));
    },
    [confirmUpdateGroupSetting, updateGroupInfo],
  );

  const updateBusinessSwitch = useCallback(
    (field: BusinessSwitchField, checked: boolean) => {
      confirmUpdateGroupSetting(() =>
        updateRoomSettings({
          [field]: toBinarySwitch(checked),
        } as Pick<RoomSettingsParams, BusinessSwitchField>),
      );
    },
    [confirmUpdateGroupSetting, updateRoomSettings],
  );

  const updateBusinessNumber = useCallback(
    (field: BusinessNumberField, value: number) => {
      confirmUpdateGroupSetting(() =>
        updateRoomSettings({
          [field]: value,
        } as Pick<RoomSettingsParams, BusinessNumberField>),
      );
    },
    [confirmUpdateGroupSetting, updateRoomSettings],
  );

  const updateJoinMethod = useCallback(
    (value: number) => {
      confirmUpdateGroupSetting(() =>
        updateRoomSettings({
          joinMethod: value,
          isNeedVerify: value === 1 ? 1 : 0,
        }),
      );
    },
    [confirmUpdateGroupSetting, updateRoomSettings],
  );

  const updateGroupChatRecordTimeOut = useCallback(
    (chatRecordTimeOut: string) => {
      confirmUpdateGroupSetting(() =>
        updateRoomSettings({
          chatRecordTimeOut,
        }),
      );
    },
    [confirmUpdateGroupSetting, updateRoomSettings],
  );

  const updateAllMuted = useCallback(
    (checked: boolean) => {
      if (!currentGroupInfo || !businessRoomId) {
        feedbackToast({ error: new Error(t("toast.updateGroupInfoFailed")) });
        return;
      }

      confirmUpdateGroupSetting(async () => {
        await IMSDK.changeGroupMute({
          groupID: currentGroupInfo.groupID,
          isMute: checked,
        });
        setAllMutedOverride(checked);
      });
    },
    [businessRoomId, confirmUpdateGroupSetting, currentGroupInfo],
  );

  const updateMessageDestroyContentTypes = useCallback(
    (contentTypes: number[]) => {
      if (!contentTypes.length) {
        feedbackToast({ error: t("toast.selectMessageDestroyContentType") });
        return;
      }

      confirmUpdateGroupSetting(() =>
        updateRoomSettings({
          messageDestroyContentTypes: contentTypes.join(","),
        }),
      );
    },
    [confirmUpdateGroupSetting, updateRoomSettings],
  );

  const updateGroupVerification = useCallback(
    (checked: boolean) => {
      confirmUpdateGroupSetting(() =>
        updateGroupPermission(
          {
            needVerification: checked
              ? GroupVerificationType.AllNeed
              : GroupVerificationType.AllNot,
          },
          {
            isNeedVerify: toBinarySwitch(checked),
            joinMethod: checked ? 1 : 0,
          },
        ),
      );
    },
    [confirmUpdateGroupSetting, updateGroupPermission],
  );

  const updateShowRead = useCallback(
    (checked: boolean) => {
      confirmUpdateGroupSetting(() =>
        updateGroupPermission(
          { displayIsRead: checked },
          { showRead: toBinarySwitch(checked) },
        ),
      );
    },
    [confirmUpdateGroupSetting, updateGroupPermission],
  );

  const updateLookMemberInfo = useCallback(
    (checked: boolean) => {
      confirmUpdateGroupSetting(() =>
        updateGroupPermission(
          {
            lookMemberInfo: checked ? AllowType.Allowed : AllowType.NotAllowed,
          },
          { showMember: toBinarySwitch(checked) },
        ),
      );
    },
    [confirmUpdateGroupSetting, updateGroupPermission],
  );

  const updateApplyMemberFriend = useCallback(
    (checked: boolean) => {
      confirmUpdateGroupSetting(() =>
        updateGroupPermission(
          {
            applyMemberFriend: checked ? AllowType.Allowed : AllowType.NotAllowed,
          },
          {
            allowAddFriend: toBinarySwitch(checked),
            allowSendCard: toBinarySwitch(checked),
          },
        ),
      );
    },
    [confirmUpdateGroupSetting, updateGroupPermission],
  );

  const transferGroup = () => {
    const groupID = toBusinessText(currentGroupInfo?.groupID).trim();

    if (!groupID || !businessRoomId) {
      feedbackToast({ error: new Error(t("toast.updateGroupInfoFailed")) });
      return;
    }

    emit("OPEN_CHOOSE_MODAL", {
      type: "TRANSFER_IN_GROUP",
      extraData: {
        groupID,
        roomId: businessRoomId,
      } satisfies GroupChooseExtraData,
    });
  };

  const hasPermissions = isAdmin || isOwner;
  const canViewMembers = isBusinessSwitchOn(
    businessGroupInfo?.showMember,
    currentGroupInfo?.lookMemberInfo !== AllowType.NotAllowed,
  );
  const canAddMemberFriend = isBusinessSwitchOn(
    businessGroupInfo?.allowAddFriend ?? businessGroupInfo?.allowSendCard,
    currentGroupInfo?.applyMemberFriend !== AllowType.NotAllowed,
  );
  const showReadEnabled = isBusinessSwitchOn(
    businessGroupInfo?.showRead,
    Boolean(currentGroupInfo?.displayIsRead),
  );
  const groupVerificationEnabled = isBusinessSwitchOn(
    businessGroupInfo?.isNeedVerify,
    currentGroupInfo?.needVerification !== GroupVerificationType.AllNot,
  );
  const joinMethodValue = getBusinessInteger(
    businessGroupInfo?.joinMethod,
    groupVerificationEnabled ? 1 : 0,
  );
  const messageDestroyEnabled = isBusinessSwitchOn(
    businessGroupInfo?.messageDestroyEnabled,
    false,
  );
  const allMutedEnabled =
    allMutedOverride ?? isBusinessSwitchOn(businessGroupInfo?.limitSendSmg, false);
  const burnAfterReadEnabled = isBusinessSwitchOn(
    businessGroupInfo?.burnAfterReadEnabled,
    false,
  );
  const canShareQRCode =
    hasPermissions || isBusinessSwitchOn(businessGroupInfo?.allowShareQR, true);
  const canViewOnlineMembers =
    hasPermissions || isBusinessSwitchOn(businessGroupInfo?.showOnlineStatus, true);
  const canInviteMember =
    hasPermissions || isBusinessSwitchOn(businessGroupInfo?.allowInviteFriend, true);
  const canQuitGroup =
    !isNomal || isBusinessSwitchOn(businessGroupInfo?.allowQuitRoom, true);
  const groupNoPushEnabled = getOptionalBusinessSwitch(
    businessGroupInfo?.myMember?.offlineNoPushMsg,
    currentConversation?.recvMsgOpt !== undefined &&
      currentConversation.recvMsgOpt !== MessageReceiveOptType.Normal,
  );
  const groupTopEnabled = getOptionalBusinessSwitch(
    businessGroupInfo?.myMember?.top,
    Boolean(currentConversation?.isPinned),
  );
  const joinMethodOptions = useMemo(
    () => [
      {
        label: t("placeholder.joinMethodFree"),
        value: 0,
      },
      {
        label: t("placeholder.joinMethodVerify"),
        value: 1,
      },
      {
        label: t("placeholder.joinMethodForbidden"),
        value: 2,
      },
    ],
    [],
  );
  const messageDestroyContentTypeOptions = useMemo(
    () =>
      messageDestroyContentTypeConfig.map(({ labelKey, value }) => ({
        label: t(labelKey),
        value,
      })),
    [],
  );
  const chatRecordTimeOutValue = normalizeChatRecordTimeOut(
    businessGroupInfo?.chatRecordTimeOut,
  );
  const messageDestroyContentTypeValues = normalizeMessageDestroyContentTypes(
    businessGroupInfo?.messageDestroyContentTypes,
  );
  const chatRecordTimeOutOptions = useMemo(
    () => [
      { value: "-1.0", label: t("close") },
      { value: "1.0", label: t("date.day", { num: 1 }) },
      { value: "7.0", label: t("date.day", { num: 7 }) },
      { value: "30.0", label: t("date.day", { num: 30 }) },
      { value: "90.0", label: t("date.day", { num: 90 }) },
      { value: "365.0", label: t("date.day", { num: 365 }) },
    ],
    [],
  );

  useEffect(() => {
    setAllMutedOverride(undefined);
  }, [businessRoomId]);

  const updateGroupNoPush = useCallback(
    (checked: boolean) => {
      if (!currentGroupInfo || !currentConversation) return;
      if (!businessRoomId) {
        feedbackToast({ error: new Error(t("toast.updateGroupInfoFailed")) });
        return;
      }

      confirmUpdateGroupSetting(async () => {
        try {
          const nextOpt = checked
            ? MessageReceiveOptType.NotNotify
            : MessageReceiveOptType.Normal;

          const offlineNoPushMsg = toBinarySwitch(checked);
          await setOpenIMGroupOfflineNoPush({
            roomId: businessRoomId,
            offlineNoPushMsg,
          });
          await IMSDK.setConversationRecvMessageOpt({
            conversationID: currentConversation.conversationID,
            opt: nextOpt,
          }).catch((error) => {
            console.warn("Failed to sync group no-push to OpenIM SDK", error);
          });
          await updateCurrentConversation({
            ...currentConversation,
            recvMsgOpt: nextOpt,
          });
          updateCurrentGroupInfo({
            ...currentGroupInfo,
            myMember: {
              ...(businessGroupInfo?.myMember ?? {}),
              offlineNoPushMsg,
            },
          } as typeof currentGroupInfo);
          feedbackToast();
        } catch (error) {
          feedbackToast({ error });
        }
      });
    },
    [
      businessRoomId,
      businessGroupInfo?.myMember,
      confirmUpdateGroupSetting,
      currentConversation,
      currentGroupInfo,
      updateCurrentGroupInfo,
      updateCurrentConversation,
    ],
  );

  const updateGroupTop = useCallback(
    (checked: boolean) => {
      if (!currentGroupInfo || !currentConversation) return;
      if (!businessRoomId) {
        feedbackToast({ error: new Error(t("toast.updateGroupInfoFailed")) });
        return;
      }

      confirmUpdateGroupSetting(async () => {
        try {
          const top = toBinarySwitch(checked);
          await setOpenIMGroupTop({
            roomId: businessRoomId,
            top,
          });
          await IMSDK.pinConversation({
            conversationID: currentConversation.conversationID,
            isPinned: checked,
          }).catch((error) => {
            console.warn("Failed to sync group pin to OpenIM SDK", error);
          });
          await updateCurrentConversation({
            ...currentConversation,
            isPinned: checked,
          });
          updateCurrentGroupInfo({
            ...currentGroupInfo,
            myMember: {
              ...(businessGroupInfo?.myMember ?? {}),
              top,
            },
          } as typeof currentGroupInfo);
          feedbackToast();
        } catch (error) {
          feedbackToast({ error });
        }
      });
    },
    [
      businessRoomId,
      businessGroupInfo?.myMember,
      confirmUpdateGroupSetting,
      currentConversation,
      currentGroupInfo,
      updateCurrentGroupInfo,
      updateCurrentConversation,
    ],
  );

  const clearGroupMessages = useCallback(() => {
    if (!currentGroupInfo || !currentConversation) return;
    if (!businessRoomId) {
      feedbackToast({ error: new Error(t("toast.updateGroupInfoFailed")) });
      return;
    }

    modal.confirm({
      title: t("toast.clearChatHistory"),
      content: t("toast.confirmClearChatHistory"),
      onOk: async () => {
        try {
          await clearOpenIMGroupMessages({
            roomId: businessRoomId,
          });
          await IMSDK.clearConversationAndDeleteAllMsg(
            currentConversation.conversationID,
          );
          clearMessageList();
          feedbackToast();
        } catch (error) {
          feedbackToast({ error });
        }
      },
    });
  }, [businessRoomId, currentConversation, currentGroupInfo]);

  const reportGroup = useCallback(() => {
    const reportRoomId = businessRoomId || fallbackGroupID;

    if (!reportRoomId) {
      feedbackToast({ error: new Error(t("toast.updateGroupInfoFailed")) });
      return;
    }

    let reason = "";
    modal.confirm({
      title: t("placeholder.reportGroup"),
      content: (
        <Input.TextArea
          maxLength={200}
          showCount
          autoSize={{ minRows: 3, maxRows: 5 }}
          placeholder={t("placeholder.reportReason")}
          onChange={(event) => {
            reason = event.target.value;
          }}
        />
      ),
      onOk: async () => {
        const normalizedReason = reason.trim();
        if (!normalizedReason) {
          feedbackToast({ error: new Error(t("placeholder.reportReason")) });
          return Promise.reject();
        }

        try {
          await reportBusinessTarget({
            roomId: reportRoomId,
            reportType: ReportTargetType.Room,
            reportInfo: fallbackGroupID ? `groupID:${fallbackGroupID}` : undefined,
            reason: normalizedReason,
            webUrl: window.location.href,
          });
          feedbackToast();
        } catch (error) {
          feedbackToast({ error });
        }
      },
    });
  }, [businessRoomId, fallbackGroupID]);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center p-4">
        <div className="flex items-center">
          <Upload
            accept="image/*"
            className={clsx({ "disabled-upload": isNomal })}
            openFileDialogOnClick={hasPermissions}
            showUploadList={false}
            customRequest={customUpload as any}
          >
            <div className="relative">
              <OIMAvatar
                isgroup
                src={currentGroupInfo?.faceURL}
                text={currentGroupInfo?.groupName}
              />
              {hasPermissions && (
                <img
                  className="absolute -bottom-1 -right-1"
                  width={15}
                  src={edit_avatar}
                  alt="edit avatar"
                />
              )}
            </div>
          </Upload>

          <EditableContent
            textClassName="font-medium"
            value={currentGroupInfo?.groupName}
            editable={hasPermissions}
            onChange={updateGroupName}
          />
        </div>
      </div>

      <Divider className="m-0 border-4 border-[#F4F5F7]" />
      {currentGroupInfo && isJoinGroup && canViewMembers && (
        <GroupMemberRow
          currentGroupInfo={currentGroupInfo}
          canInviteMember={canInviteMember}
          isNomal={isNomal}
          updateTravel={updateTravel}
        />
      )}
      <Divider className="m-0 border-4 border-[#F4F5F7]" />

      <Divider className="m-0 border-4 border-[#F4F5F7]" />
      <SettingRow className="pb-2" title={`${t("placeholder.group")}ID`}>
        <div className="flex items-center">
          <span className="mr-1 text-xs text-[var(--sub-text)]">
            {currentGroupInfo?.groupID}
          </span>
          <img
            className="cursor-pointer"
            width={14}
            src={copy}
            alt=""
            onClick={() => {
              copyToClipboard(currentGroupInfo?.groupID ?? "");
              feedbackToast({ msg: t("toast.copySuccess") });
            }}
          />
        </div>
      </SettingRow>
      <SettingRow title={t("placeholder.groupTppe")}>
        <span className="text-xs text-[var(--sub-text)]">
          {t("placeholder.workGroup")}
        </span>
      </SettingRow>
      {currentGroupInfo && isJoinGroup && (
        <GroupBusinessEntrances
          roomId={businessRoomId}
          hasPermissions={hasPermissions}
          canShareQRCode={canShareQRCode}
          canViewOnlineMembers={canViewOnlineMembers}
        />
      )}

      <Divider className="m-0 border-4 border-[#F4F5F7]" />

      {currentGroupInfo && isJoinGroup && currentConversation && (
        <>
          <SettingRow
            title={t("placeholder.groupDoNotDisturb")}
            value={groupNoPushEnabled}
            tryChange={updateGroupNoPush}
          />
          <SettingRow
            title={t("placeholder.pinGroup")}
            value={groupTopEnabled}
            tryChange={updateGroupTop}
          />
          <SettingRow
            className="cursor-pointer"
            title={t("toast.clearChatHistory")}
            rowClick={clearGroupMessages}
          >
            <RightOutlined rev={undefined} />
          </SettingRow>
          <Divider className="m-0 border-4 border-[#F4F5F7]" />
        </>
      )}

      {hasPermissions && (
        <>
          <SettingRow title={t("placeholder.groupJoinMethod")}>
            <Select
              className="w-32"
              size="small"
              value={joinMethodValue}
              options={joinMethodOptions}
              onChange={(value) => updateJoinMethod(value)}
            />
          </SettingRow>
          <SettingRow
            title={t("placeholder.groupVerification")}
            value={groupVerificationEnabled}
            tryChange={updateGroupVerification}
          />
          <SettingRow
            title={t("placeholder.allowGroupSearch")}
            value={isBusinessSwitchOn(businessGroupInfo?.searchable, true)}
            tryChange={(checked) => updateBusinessSwitch("searchable", checked)}
          />
          <SettingRow
            title={t("placeholder.showReadStatus")}
            value={showReadEnabled}
            tryChange={updateShowRead}
          />
          <SettingRow
            title={t("placeholder.allMuted")}
            value={allMutedEnabled}
            tryChange={updateAllMuted}
          />
          <SettingRow
            title={t("placeholder.allowViewGroupMembers")}
            value={canViewMembers}
            tryChange={updateLookMemberInfo}
          />
          <SettingRow
            title={t("placeholder.allowAddGroupMemberFriend")}
            value={canAddMemberFriend}
            tryChange={updateApplyMemberFriend}
          />
          <SettingRow
            title={t("placeholder.allowMemberInviteFriend")}
            value={isBusinessSwitchOn(businessGroupInfo?.allowInviteFriend, true)}
            tryChange={(checked) => updateBusinessSwitch("allowInviteFriend", checked)}
          />
          <SettingRow
            title={t("placeholder.allowEditGroupNickname")}
            value={isBusinessSwitchOn(businessGroupInfo?.allowEditNickname, true)}
            tryChange={(checked) => updateBusinessSwitch("allowEditNickname", checked)}
          />
          <SettingRow
            title={t("placeholder.allowShareGroupQRCode")}
            value={isBusinessSwitchOn(businessGroupInfo?.allowShareQR, true)}
            tryChange={(checked) => updateBusinessSwitch("allowShareQR", checked)}
          />
          <SettingRow
            title={t("placeholder.allowViewOnlineStatus")}
            value={isBusinessSwitchOn(businessGroupInfo?.showOnlineStatus, true)}
            tryChange={(checked) => updateBusinessSwitch("showOnlineStatus", checked)}
          />
          <SettingRow
            title={t("placeholder.allowMemberUploadFile")}
            value={isBusinessSwitchOn(businessGroupInfo?.allowUploadFile, true)}
            tryChange={(checked) => updateBusinessSwitch("allowUploadFile", checked)}
          />
          <SettingRow
            title={t("placeholder.allowMemberPrivateChat")}
            value={isBusinessSwitchOn(businessGroupInfo?.allowMemberPrivateChat, true)}
            tryChange={(checked) =>
              updateBusinessSwitch("allowMemberPrivateChat", checked)
            }
          />
          <SettingRow
            title={t("placeholder.allowMemberAtAll")}
            value={isBusinessSwitchOn(businessGroupInfo?.allowAtAll, true)}
            tryChange={(checked) => updateBusinessSwitch("allowAtAll", checked)}
          />
          <SettingRow
            title={t("placeholder.allowMemberCreateNotice")}
            value={isBusinessSwitchOn(businessGroupInfo?.allowCreateNotice, true)}
            tryChange={(checked) => updateBusinessSwitch("allowCreateNotice", checked)}
          />
          <SettingRow
            title={t("placeholder.allowMemberConference")}
            value={isBusinessSwitchOn(businessGroupInfo?.allowConference, true)}
            tryChange={(checked) => updateBusinessSwitch("allowConference", checked)}
          />
          <SettingRow
            title={t("placeholder.allowMemberSpeakCourse")}
            value={isBusinessSwitchOn(businessGroupInfo?.allowSpeakCourse, true)}
            tryChange={(checked) => updateBusinessSwitch("allowSpeakCourse", checked)}
          />
          <SettingRow
            title={t("placeholder.allowMemberQuitGroup")}
            value={isBusinessSwitchOn(businessGroupInfo?.allowQuitRoom, true)}
            tryChange={(checked) => updateBusinessSwitch("allowQuitRoom", checked)}
          />
          <NumberSettingRow
            title={t("placeholder.messageRecallTime")}
            min={1}
            max={604800}
            unit={t("date.second", { num: "" }).trim()}
            value={getBusinessNumber(businessGroupInfo?.withdrawTime)}
            onSave={(value) => updateBusinessNumber("withdrawTime", value)}
          />
          <SettingRow title={t("placeholder.chatRecordRetention")}>
            <Select
              className="w-28"
              size="small"
              value={chatRecordTimeOutValue}
              options={chatRecordTimeOutOptions}
              onChange={updateGroupChatRecordTimeOut}
            />
          </SettingRow>
          <SettingRow
            title={t("placeholder.messageDestruct")}
            value={messageDestroyEnabled}
            tryChange={(checked) =>
              updateBusinessSwitch("messageDestroyEnabled", checked)
            }
          />
          <NumberSettingRow
            title={t("placeholder.messageDestructTime")}
            min={1}
            max={3650}
            unit={t("time.day")}
            disabled={!messageDestroyEnabled}
            value={getBusinessNumber(businessGroupInfo?.messageDestroyDays)}
            onSave={(value) => updateBusinessNumber("messageDestroyDays", value)}
          />
          <SettingRow title={t("placeholder.messageDestroyContentTypes")}>
            <Select
              mode="multiple"
              className="w-44"
              size="small"
              disabled={!messageDestroyEnabled}
              value={messageDestroyContentTypeValues}
              options={messageDestroyContentTypeOptions}
              maxTagCount="responsive"
              onChange={updateMessageDestroyContentTypes}
            />
          </SettingRow>
          <SettingRow
            title={t("placeholder.messageDestroyNotice")}
            value={isBusinessSwitchOn(
              businessGroupInfo?.messageDestroyNoticeEnabled,
              false,
            )}
            tryChange={(checked) =>
              updateBusinessSwitch("messageDestroyNoticeEnabled", checked)
            }
          />
          <SettingRow
            title={t("placeholder.privateChat")}
            value={burnAfterReadEnabled}
            tryChange={(checked) =>
              updateBusinessSwitch("burnAfterReadEnabled", checked)
            }
          />
          <NumberSettingRow
            title={t("placeholder.privateChatTime")}
            min={1}
            max={86400}
            unit={t("date.second", { num: "" }).trim()}
            disabled={!burnAfterReadEnabled}
            value={getBusinessNumber(businessGroupInfo?.burnAfterReadSeconds)}
            onSave={(value) => updateBusinessNumber("burnAfterReadSeconds", value)}
          />
          <SettingRow
            title={t("placeholder.burnAfterReadNotice")}
            value={isBusinessSwitchOn(
              businessGroupInfo?.burnAfterReadNoticeEnabled,
              false,
            )}
            tryChange={(checked) =>
              updateBusinessSwitch("burnAfterReadNoticeEnabled", checked)
            }
          />

          <Divider className="m-0 border-4 border-[#F4F5F7]" />
        </>
      )}

      {isOwner && (
        <>
          <Divider className="m-0 border-4 border-[#F4F5F7]" />
          <SettingRow
            className="cursor-pointer"
            title={t("placeholder.transferGroup")}
            rowClick={transferGroup}
          >
            <RightOutlined rev={undefined} />
          </SettingRow>
        </>
      )}

      {currentGroupInfo && isJoinGroup && (
        <>
          <Divider className="m-0 border-4 border-[#F4F5F7]" />
          <SettingRow
            className="cursor-pointer text-red-500"
            title={t("placeholder.reportGroup")}
            rowClick={reportGroup}
          >
            <RightOutlined rev={undefined} />
          </SettingRow>
        </>
      )}

      <div className="flex-1" />
      {isJoinGroup && (
        <div className="flex w-full justify-center pb-3 pt-24">
          {!isOwner && canQuitGroup ? (
            <Button type="primary" danger ghost onClick={tryQuitGroup}>
              {t("placeholder.exitGroup")}
            </Button>
          ) : isOwner ? (
            <Button type="primary" danger onClick={tryDismissGroup}>
              {t("placeholder.disbandGroup")}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default memo(GroupSettings);
