import { CloseOutlined } from "@ant-design/icons";
import { GroupType, SessionType } from "@openim/wasm-client-sdk";
import type {
  GroupItem,
  MessageItem as OpenIMMessageItem,
} from "@openim/wasm-client-sdk/lib/types/entity";
import { Button, Input, Modal, Upload } from "antd";
import clsx from "clsx";
import i18n, { t } from "i18next";
import {
  FC,
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useEffect,
  useRef,
  useState,
} from "react";

import { message, modal } from "@/AntdGlobalComp";
import { forwardMergeMessageBefore } from "@/api/chat";
import { createBusinessGroup } from "@/api/group";
import OIMAvatar from "@/components/OIMAvatar";
import { useConversationToggle } from "@/hooks/useConversationToggle";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { IMSDK } from "@/layout/MainContentWrap";
import { FileWithPath } from "@/pages/chat/queryChat/ChatFooter/SendActionBar/useFileMessage";
import { useContactStore } from "@/store/contact";
import {
  BusinessRecord,
  isBusinessRecord,
  pickBusinessAuditId,
  toBusinessText,
  unwrapBusinessPayload,
} from "@/utils/businessPayload";
import { feedbackToast, isSameID } from "@/utils/common";
import { emit } from "@/utils/events";
import { uploadFile } from "@/utils/imCommon";

import ChooseBox, { ChooseBoxHandle } from "./ChooseBox";
import { CheckListItem } from "./ChooseBox/CheckItem";

export type ChooseModalType =
  | "CRATE_GROUP"
  | "INVITE_TO_GROUP"
  | "KICK_FORM_GROUP"
  | "TRANSFER_IN_GROUP"
  | "SELECT_USER"
  | "FORWARD_MESSAGE";

export interface SelectUserExtraData {
  notConversation: boolean;
  list: CheckListItem[];
}

export interface GroupChooseExtraData {
  groupID: string;
  roomId?: string;
}

export interface ChooseModalState {
  type: ChooseModalType;
  extraData?: unknown;
}

export interface ForwardMessageExtraData {
  message: OpenIMMessageItem;
}

interface IChooseModalProps {
  state: ChooseModalState;
}

const titleMap = {
  CRATE_GROUP: t("placeholder.createGroup"),
  INVITE_TO_GROUP: t("placeholder.invitation"),
  KICK_FORM_GROUP: t("placeholder.kickMember"),
  TRANSFER_IN_GROUP: t("placeholder.transferGroup"),
  SELECT_USER: t("placeholder.selectUser"),
  FORWARD_MESSAGE: t("placeholder.forward"),
};

i18n.on("languageChanged", () => {
  titleMap.CRATE_GROUP = t("placeholder.createGroup");
  titleMap.INVITE_TO_GROUP = t("placeholder.invitation");
  titleMap.KICK_FORM_GROUP = t("placeholder.kickMember");
  titleMap.TRANSFER_IN_GROUP = t("placeholder.transferGroup");
  titleMap.SELECT_USER = t("placeholder.selectUser");
  titleMap.FORWARD_MESSAGE = t("placeholder.forward");
});

const onlyOneTypes = ["TRANSFER_IN_GROUP"];
const onlyMemberTypes = ["KICK_FORM_GROUP", "TRANSFER_IN_GROUP"];
const groupActionTypes: ChooseModalType[] = [
  "INVITE_TO_GROUP",
  "KICK_FORM_GROUP",
  "TRANSFER_IN_GROUP",
];

const getConfirmContent = (type: ChooseModalType) => {
  switch (type) {
    case "CRATE_GROUP":
      return t("placeholder.confirmCreateGroup");
    case "INVITE_TO_GROUP":
      return t("placeholder.confirmInviteToGroup");
    case "KICK_FORM_GROUP":
      return t("placeholder.confirmKickFromGroup");
    case "TRANSFER_IN_GROUP":
      return t("placeholder.confirmTransferGroup");
    case "FORWARD_MESSAGE":
      return t("placeholder.confirmForwardMessage");
    default:
      return t("placeholder.confirmChooseAction");
  }
};

const shouldConfirmChoose = (type: ChooseModalType, choosedList: CheckListItem[]) => {
  if (type === "SELECT_USER") {
    return false;
  }
  return true;
};

const isOpenIMMessagePayload = (value: unknown): value is OpenIMMessageItem =>
  isBusinessRecord(value) &&
  (typeof value.clientMsgID === "string" || typeof value.contentType === "number");

const normalizeChooseText = (value: unknown) => toBusinessText(value).trim();

const parseChooseJsonRecord = (value: unknown): BusinessRecord | undefined => {
  const text = normalizeChooseText(value);
  if (!text) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(text);
    return isBusinessRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const createdGroupNestedKeys = [
  "data",
  "result",
  "obj",
  "room",
  "group",
  "groupInfo",
  "roomInfo",
  "openIMGroup",
  "openimGroup",
  "openImGroup",
  "openIM",
  "openim",
  "businessRoom",
  "roomMapping",
  "mapping",
  "openIMMapping",
  "openimMapping",
];

const openIMGroupIDKeys = [
  "openIMGroupID",
  "openIMGroupId",
  "openimGroupID",
  "openimGroupId",
  "openImGroupID",
  "openImGroupId",
  "groupID",
  "groupId",
];

const businessRoomIDKeys = [
  "roomId",
  "roomID",
  "businessRoomId",
  "businessRoomID",
  "jid",
  "roomJid",
  "roomJID",
  "id",
];

const pickCreatedBusinessValue = (
  value: unknown,
  keys: string[],
  seen = new Set<BusinessRecord>(),
): string => {
  if (!isBusinessRecord(value) || seen.has(value)) {
    return "";
  }
  seen.add(value);

  const directValue = keys.map((key) => normalizeChooseText(value[key])).find(Boolean);

  if (directValue) {
    return directValue;
  }

  return (
    [
      ...createdGroupNestedKeys.map((key) => value[key]),
      parseChooseJsonRecord(value.ex),
    ]
      .map((item) => pickCreatedBusinessValue(item, keys, seen))
      .find(Boolean) ?? ""
  );
};

const getJoinedSDKGroupList = async () => {
  const groups: GroupItem[] = [];
  let offset = 0;

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data } = await IMSDK.getJoinedGroupListPage({ offset, count: 1000 });
      groups.push(...data);
      offset += 1000;
      if (data.length < 1000) {
        break;
      }
    }
  } catch (error) {
    console.debug("Skipped SDK joined group list when resolving created group", error);
  }

  return groups;
};

const getStoredGroupIDCandidates = (businessRoomID: string) => {
  const normalizedRoomID = normalizeChooseText(businessRoomID);
  if (!normalizedRoomID) {
    return [];
  }

  return useContactStore
    .getState()
    .groupList.filter((group) => {
      const record = group as unknown as BusinessRecord;
      return businessRoomIDKeys.some((key) =>
        isSameID(normalizeChooseText(record[key]), normalizedRoomID),
      );
    })
    .map((group) => normalizeChooseText(group.groupID))
    .filter(Boolean);
};

const resolveCreatedSDKGroupID = async (businessPayload: unknown) => {
  const openIMGroupID = pickCreatedBusinessValue(businessPayload, openIMGroupIDKeys);
  const businessRoomID = pickCreatedBusinessValue(businessPayload, businessRoomIDKeys);

  await useContactStore.getState().ensureGroupListLoaded(true);

  const candidates = Array.from(
    new Set(
      [openIMGroupID, ...getStoredGroupIDCandidates(businessRoomID), businessRoomID]
        .map(normalizeChooseText)
        .filter(Boolean),
    ),
  );

  const joinedGroups = await getJoinedSDKGroupList();
  const joinedGroupID = candidates
    .map(
      (candidate) =>
        joinedGroups.find((group) => isSameID(group.groupID, candidate))?.groupID,
    )
    .find(Boolean);

  if (joinedGroupID) {
    return joinedGroupID;
  }

  console.debug("createBusinessGroup response missing SDK group id", {
    openIMGroupID,
    businessRoomID,
    businessPayload,
  });
  return "";
};

const getGroupChooseExtraData = (value: unknown): GroupChooseExtraData => {
  if (isBusinessRecord(value)) {
    return {
      groupID: normalizeChooseText(value.groupID ?? value.groupId),
      roomId: normalizeChooseText(value.roomId ?? value.roomID),
    };
  }

  return {
    groupID: normalizeChooseText(value),
  };
};

const getSelectedUserIDs = (choosedList: CheckListItem[]) =>
  choosedList.map((item) => normalizeChooseText(item.userID)).filter(Boolean);

const getForwardMessagePayload = (response: unknown) => {
  const payload = unwrapBusinessPayload(response);

  if (isOpenIMMessagePayload(payload)) {
    return payload;
  }
  if (!isBusinessRecord(payload)) {
    return undefined;
  }

  return [
    payload.message,
    payload.messageItem,
    payload.openIMMessage,
    payload.sdkMessage,
    payload.payload,
  ].find(isOpenIMMessagePayload);
};

const getForwardTarget = (item: CheckListItem) => {
  const groupID = normalizeChooseText(item.groupID);
  if (groupID) {
    return {
      targetType: "group" as const,
      targetId: groupID,
      recvID: "",
      groupID,
    };
  }

  const userID = normalizeChooseText(item.userID);
  if (userID) {
    return {
      targetType: "single" as const,
      targetId: userID,
      recvID: userID,
      groupID: "",
    };
  }

  return undefined;
};

const ChooseModal: ForwardRefRenderFunction<OverlayVisibleHandle, IChooseModalProps> = (
  { state: { type, extraData } },
  ref,
) => {
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  return (
    <Modal
      title={null}
      footer={null}
      centered
      open={isOverlayOpen}
      closable={false}
      width={680}
      onCancel={closeOverlay}
      destroyOnClose
      styles={{
        mask: {
          opacity: 0,
          transition: "none",
        },
      }}
      className="no-padding-modal max-w-[80vw]"
      maskTransitionName=""
    >
      <ChooseContact
        isOverlayOpen={isOverlayOpen}
        type={type}
        extraData={extraData}
        closeOverlay={closeOverlay}
      />
    </Modal>
  );
};

export default memo(forwardRef(ChooseModal));

type ChooseContactProps = {
  isOverlayOpen: boolean;
  type: ChooseModalType;
  extraData?: unknown;
  closeOverlay: () => void;
};

export const ChooseContact: FC<ChooseContactProps> = ({
  isOverlayOpen,
  type,
  extraData,
  closeOverlay,
}) => {
  const chooseBoxRef = useRef<ChooseBoxHandle>(null);
  const [loading, setLoading] = useState(false);
  const [groupBaseInfo, setGroupBaseInfo] = useState({
    groupName: "",
    groupAvatar: "",
  });

  const { toSpecifiedConversation } = useConversationToggle();

  useEffect(() => {
    if (isOverlayOpen && type === "CRATE_GROUP") {
      void useContactStore.getState().ensureFriendListLoaded(true);
    }
    if (isOverlayOpen && type === "CRATE_GROUP" && extraData) {
      setTimeout(
        () => chooseBoxRef.current?.updatePrevCheckList(extraData as CheckListItem[]),
        100,
      );
    }
    if (isOverlayOpen && type === "SELECT_USER" && extraData) {
      setTimeout(
        () =>
          chooseBoxRef.current?.updatePrevCheckList(
            (extraData as SelectUserExtraData).list,
          ),
        100,
      );
    }
    if (!isOverlayOpen) resetState();
  }, [isOverlayOpen, type, extraData]);

  const runChooseAction = async (choosedList: CheckListItem[]) => {
    setLoading(true);
    try {
      switch (type) {
        case "CRATE_GROUP": {
          const memberUserIDs = getSelectedUserIDs(choosedList);
          if (!memberUserIDs.length) {
            feedbackToast({ error: new Error(t("toast.updateGroupInfoFailed")) });
            break;
          }

          let createdGroupID = "";
          let shouldFallbackToSDK = false;

          try {
            const businessResponse = await createBusinessGroup({
              room: {
                roomName: groupBaseInfo.groupName,
                groupName: groupBaseInfo.groupName,
                name: groupBaseInfo.groupName,
                subject: groupBaseInfo.groupName,
                faceURL: groupBaseInfo.groupAvatar,
                avatar: groupBaseInfo.groupAvatar,
              },
              text: memberUserIDs,
              keys: "openim-web-create-group",
            });
            const businessPayload = unwrapBusinessPayload(businessResponse);

            try {
              createdGroupID = await resolveCreatedSDKGroupID(businessPayload);
            } catch (error) {
              console.debug(
                "createBusinessGroup succeeded, but SDK group resolving failed",
                error,
              );
            }
          } catch (error) {
            shouldFallbackToSDK = true;
            console.debug("createBusinessGroup failed, fallback to SDK", error);
          }

          if (!shouldFallbackToSDK) {
            if (createdGroupID) {
              await toSpecifiedConversation({
                sourceID: createdGroupID,
                sessionType: SessionType.WorkingGroup,
              });
            } else {
              feedbackToast({ msg: t("toast.accessSuccess") });
            }
          }

          if (shouldFallbackToSDK) {
            const { data: createdGroup } = await IMSDK.createGroup({
              groupInfo: {
                groupType: GroupType.WorkingGroup,
                groupName: groupBaseInfo.groupName,
                faceURL: groupBaseInfo.groupAvatar,
              },
              memberUserIDs,
              adminUserIDs: [],
            });
            const sdkCreatedGroupID = normalizeChooseText(createdGroup.groupID);

            if (sdkCreatedGroupID) {
              await toSpecifiedConversation({
                sourceID: sdkCreatedGroupID,
                sessionType: SessionType.WorkingGroup,
              });
            }
          }
          break;
        }
        case "INVITE_TO_GROUP": {
          const { groupID, roomId } = getGroupChooseExtraData(extraData);
          const userIDList = getSelectedUserIDs(choosedList);
          if (!groupID || !roomId || !userIDList.length) {
            feedbackToast({ error: new Error(t("toast.updateGroupInfoFailed")) });
            break;
          }

          await IMSDK.inviteUserToGroup({
            groupID,
            userIDList,
            reason: "",
          });
          break;
        }
        case "KICK_FORM_GROUP": {
          const { groupID, roomId } = getGroupChooseExtraData(extraData);
          const userIDList = getSelectedUserIDs(choosedList);
          if (!groupID || !roomId || !userIDList.length) {
            feedbackToast({ error: new Error(t("toast.updateGroupInfoFailed")) });
            break;
          }

          await IMSDK.kickGroupMember({
            groupID,
            userIDList,
            reason: "",
          });
          break;
        }
        case "TRANSFER_IN_GROUP": {
          const { groupID, roomId } = getGroupChooseExtraData(extraData);
          const [toUserId] = getSelectedUserIDs(choosedList);
          if (!groupID || !roomId || !toUserId) {
            feedbackToast({ error: new Error(t("toast.updateGroupInfoFailed")) });
            break;
          }

          await IMSDK.transferGroupOwner({
            groupID,
            newOwnerUserID: toUserId,
          });
          break;
        }
        case "SELECT_USER":
          emit("SELECT_USER", {
            notConversation: (extraData as SelectUserExtraData).notConversation,
            choosedList,
          });
          break;
        case "FORWARD_MESSAGE": {
          const sourceMessage = (extraData as ForwardMessageExtraData | undefined)
            ?.message;
          if (!sourceMessage) {
            feedbackToast({ error: new Error(t("toast.accessFailed")) });
            break;
          }
          const sourceAuditId = normalizeChooseText(pickBusinessAuditId(sourceMessage));
          await Promise.all(
            choosedList.map(async (item) => {
              const target = getForwardTarget(item);

              if (!target) {
                return;
              }
              const businessForwardMessage = sourceAuditId
                ? getForwardMessagePayload(
                    await forwardMergeMessageBefore({
                      auditIds: sourceAuditId,
                      targetType: target.targetType,
                      targetId: target.targetId,
                    }),
                  )
                : undefined;
              const forwardMessage =
                businessForwardMessage ??
                (await IMSDK.createForwardMessage(sourceMessage)).data;

              await IMSDK.sendMessage({
                recvID: target.recvID,
                groupID: target.groupID,
                message: forwardMessage,
              });
            }),
          );
          break;
        }
        default:
          break;
      }
      closeOverlay();
    } catch (error) {
      feedbackToast({ error });
    } finally {
      setLoading(false);
    }
  };

  const confirmChoose = async () => {
    const choosedList = chooseBoxRef.current?.getCheckedList() ?? [];
    if (!choosedList?.length && type !== "SELECT_USER")
      return message.warning(t("toast.selectLeastOne"));

    if (!groupBaseInfo.groupName.trim() && type === "CRATE_GROUP")
      return message.warning(t("toast.inputGroupName"));

    if (groupActionTypes.includes(type)) {
      const { groupID, roomId } = getGroupChooseExtraData(extraData);
      const userIDList = getSelectedUserIDs(choosedList);
      if (!groupID || !roomId || !userIDList.length) {
        feedbackToast({ error: new Error(t("toast.updateGroupInfoFailed")) });
        return;
      }
    }

    if (type === "FORWARD_MESSAGE" && !choosedList.some(getForwardTarget)) {
      feedbackToast({ error: new Error(t("toast.accessFailed")) });
      return;
    }

    if (!shouldConfirmChoose(type, choosedList)) {
      await runChooseAction(choosedList);
      return;
    }

    modal.confirm({
      title: titleMap[type],
      content: getConfirmContent(type),
      onOk: () => runChooseAction(choosedList),
    });
  };

  const resetState = () => {
    chooseBoxRef.current?.resetState();
    setGroupBaseInfo({
      groupName: "",
      groupAvatar: "",
    });
  };

  const customUpload = ({ file }: { file: FileWithPath }) => {
    modal.confirm({
      title: t("placeholder.upload"),
      content: t("placeholder.confirmUploadFile"),
      onOk: async () => {
        try {
          const {
            data: { url },
          } = await uploadFile(file);
          setGroupBaseInfo((prev) => ({ ...prev, groupAvatar: url }));
        } catch (error) {
          feedbackToast({ error: t("toast.updateAvatarFailed") });
        }
      },
    });
  };

  const isCheckInGroup = type === "INVITE_TO_GROUP";

  return (
    <>
      <div className="flex h-16 items-center justify-between bg-[var(--gap-text)] px-7">
        <div>{titleMap[type]}</div>
        <CloseOutlined
          className="cursor-pointer text-[var(--sub-text)]"
          rev={undefined}
          onClick={closeOverlay}
        />
      </div>
      {type === "CRATE_GROUP" ? (
        <div className="px-6 pt-4">
          <div className="mb-6 flex items-center">
            <div className="min-w-[60px] font-medium">{t("placeholder.groupName")}</div>
            <Input
              placeholder={t("placeholder.pleaseEnter")}
              maxLength={16}
              spellCheck={false}
              value={groupBaseInfo.groupName}
              onChange={(e) =>
                setGroupBaseInfo((state) => ({ ...state, groupName: e.target.value }))
              }
            />
          </div>
          <div className="mb-6 flex items-center">
            <div className="min-w-[60px] font-medium">
              {t("placeholder.groupAvatar")}
            </div>
            <div className="flex items-center">
              <OIMAvatar src={groupBaseInfo.groupAvatar} isgroup />
              <Upload
                accept="image/*"
                showUploadList={false}
                customRequest={customUpload as any}
              >
                <span className="ml-3 cursor-pointer text-xs text-[var(--primary)]">
                  {t("placeholder.clickToModify")}
                </span>
              </Upload>
            </div>
          </div>
          <div className="flex">
            <div className="min-w-[60px] font-medium">
              {t("placeholder.groupMember")}
            </div>
            <ChooseBox className={clsx("!m-0 !h-[40vh] flex-1")} ref={chooseBoxRef} />
          </div>
        </div>
      ) : (
        <ChooseBox
          className="!h-[60vh]"
          ref={chooseBoxRef}
          isCheckInGroup={isCheckInGroup}
          showGroupList={type === "FORWARD_MESSAGE"}
          showGroupMember={onlyMemberTypes.includes(type)}
          chooseOneOnly={onlyOneTypes.includes(type)}
          checkMemberRole={type === "KICK_FORM_GROUP"}
        />
      )}
      <div className="flex justify-end px-9 py-6">
        <Button
          className="mr-6 border-0 bg-[var(--chat-bubble)] px-6"
          onClick={closeOverlay}
        >
          {t("cancel")}
        </Button>
        <Button
          className="px-6"
          type="primary"
          loading={loading}
          onClick={confirmChoose}
        >
          {t("confirm")}
        </Button>
      </div>
    </>
  );
};
