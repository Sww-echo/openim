import { CbEvents } from "@openim/wasm-client-sdk";
import { SessionType } from "@openim/wasm-client-sdk";
import {
  FriendUserItem,
  GroupMemberItem,
  WSEvent,
} from "@openim/wasm-client-sdk/lib/types/entity";
import { useLatest } from "ahooks";
import { Button, Divider, Input, Spin } from "antd";
import dayjs from "dayjs";
import { t } from "i18next";
import {
  FC,
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useQuery } from "react-query";
import { useCopyToClipboard } from "react-use";

import { modal } from "@/AntdGlobalComp";
import {
  BusinessOnlineStatus,
  getBusinessUserOnlineStatus,
  getFriendInfo,
  updateFriendPhoneRemark,
  updateFriendRemark,
} from "@/api/friend";
import { getLegacyGroupMember, getLegacyGroupMemberInviterInfo } from "@/api/group";
import {
  BusinessUserInfo,
  getBusinessUserBindInfo,
  getBusinessUserInfo,
  getBusinessUserInfoV1,
  getCurrentBusinessUserInfo,
} from "@/api/login";
import { reportBusinessTarget, ReportTargetType } from "@/api/report";
import DraggableModalWrap from "@/components/DraggableModalWrap";
import EditableContent from "@/components/EditableContent";
import OIMAvatar from "@/components/OIMAvatar";
import { useConversationToggle } from "@/hooks/useConversationToggle";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { IMSDK } from "@/layout/MainContentWrap";
import { useContactStore, useConversationStore, useUserStore } from "@/store";
import {
  isBusinessRecord,
  pickBusinessText,
  pickExplicitBusinessRoomId,
  toBusinessText,
  unwrapBusinessPayload,
} from "@/utils/businessPayload";
import { feedbackToast, isSameID } from "@/utils/common";

import EditSelfInfo from "./EditSelfInfo";
import SendRequest from "./SendRequest";

interface IUserCardModalProps {
  userID?: string;
  groupID?: string;
  isSelf?: boolean;
  notAdd?: boolean;
  notSendMessage?: boolean;
  cardInfo?: CardInfo;
}

export type CardInfo = Partial<BusinessUserInfo & FriendUserItem>;

const getGender = (gender: number) => {
  if (!gender) return "-";
  return gender === 1 ? t("placeholder.man") : t("placeholder.female");
};

const getOnlineState = (status?: BusinessOnlineStatus) => {
  const rawStatus =
    status?.isOnline ?? status?.online ?? status?.onlineStatus ?? status?.status;

  if (rawStatus === undefined || rawStatus === null || rawStatus === "") {
    return undefined;
  }

  if (typeof rawStatus === "boolean") {
    return rawStatus;
  }

  if (typeof rawStatus === "number") {
    return rawStatus === 1;
  }

  const text = rawStatus.toLowerCase();
  if (["1", "true", "online"].includes(text)) {
    return true;
  }
  if (["0", "false", "offline"].includes(text)) {
    return false;
  }

  return undefined;
};

const unwrapFriendInfo = (response: unknown) => {
  const payload = unwrapBusinessPayload(response);

  if (!isBusinessRecord(payload)) {
    return {};
  }

  return {
    ...payload,
    ...(isBusinessRecord(payload.friend) ? payload.friend : {}),
    ...(isBusinessRecord(payload.user) ? payload.user : {}),
    ...(isBusinessRecord(payload.userInfo) ? payload.userInfo : {}),
  };
};

const getGroupInviterText = (response: unknown) => {
  const info = unwrapFriendInfo(response);

  return pickBusinessText(info, [
    "inviterNickname",
    "inviterNickName",
    "inviterName",
    "inviteUserName",
    "inviteUserNickname",
    "operatorNickname",
    "operatorName",
    "nickname",
    "nickName",
    "name",
    "inviterId",
    "inviteUserId",
    "userId",
    "userID",
  ]);
};

const getPhoneRemark = (info: CardInfo) =>
  pickBusinessText(info as Record<string, unknown>, [
    "phoneRemark",
    "phoneRemarkName",
    "mobileRemark",
    "telephoneRemark",
  ]);

const UserCardModal: ForwardRefRenderFunction<
  OverlayVisibleHandle,
  IUserCardModalProps
> = (props, ref) => {
  const { userID, isSelf, notAdd, notSendMessage } = props;
  const targetUserID = toBusinessText(userID).trim();

  const editInfoRef = useRef<OverlayVisibleHandle>(null);
  const [cardInfo, setCardInfo] = useState<CardInfo>();
  const [isSendRequest, setIsSendRequest] = useState(false);
  const [userFields, setUserFields] = useState<FieldRow[]>([]);

  const selfInfo = useUserStore((state) => state.selfInfo);
  const currentGroupInfo = useConversationStore((state) => state.currentGroupInfo);
  const isFriendUser = useContactStore(
    (state) =>
      state.friendList.findIndex((item) => isSameID(item.userID, targetUserID)) !== -1,
  );

  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);
  const { toSpecifiedConversation } = useConversationToggle();
  const [_, copyToClipboard] = useCopyToClipboard();
  const businessRoomId =
    pickExplicitBusinessRoomId(
      currentGroupInfo as unknown as Record<string, unknown> | undefined,
      props.groupID,
    ) || toBusinessText(props.groupID).trim();

  const getCardInfo = async (): Promise<{
    cardInfo: CardInfo;
    memberInfo?: GroupMemberItem | null;
  }> => {
    if (isSelf) {
      let nextSelfInfo: CardInfo = { ...selfInfo };
      try {
        nextSelfInfo = {
          ...nextSelfInfo,
          ...unwrapFriendInfo(await getCurrentBusinessUserInfo()),
        };
      } catch (error) {
        console.debug("get current business user info failed", selfInfo.userID, error);
      }
      try {
        nextSelfInfo = {
          ...nextSelfInfo,
          ...unwrapFriendInfo(await getBusinessUserBindInfo()),
        };
      } catch (error) {
        console.debug("get business user bind info failed", selfInfo.userID, error);
      }
      try {
        const onlineStatus = await getBusinessUserOnlineStatus(selfInfo.userID);
        nextSelfInfo = { ...nextSelfInfo, businessOnlineStatus: onlineStatus };
      } catch (error) {
        console.debug("get business user online status failed", selfInfo.userID, error);
      }
      return {
        cardInfo: nextSelfInfo,
      };
    }
    let userInfo: CardInfo | null = null;
    const friendInfo = useContactStore
      .getState()
      .friendList.find((item) => isSameID(item.userID, targetUserID));
    if (friendInfo) {
      userInfo = { ...friendInfo };
      try {
        userInfo = {
          ...userInfo,
          ...unwrapFriendInfo(await getFriendInfo(targetUserID)),
        };
      } catch (error) {
        console.debug("get business friend info failed", targetUserID, error);
      }
    } else {
      const { data } = await IMSDK.getUsersInfo([targetUserID]);
      userInfo = { ...(data[0] ?? {}) };
    }

    try {
      const {
        data: { users },
      } = await getBusinessUserInfo([targetUserID]);
      userInfo = { ...userInfo, ...users[0] };
    } catch (error) {
      console.debug("get business user info failed", targetUserID, error);
    }
    try {
      userInfo = {
        ...userInfo,
        ...unwrapFriendInfo(await getBusinessUserInfoV1(targetUserID, businessRoomId)),
      };
    } catch (error) {
      console.debug("get business user info v1 failed", {
        userID: targetUserID,
        roomId: businessRoomId,
        error,
      });
    }
    try {
      const onlineStatus = await getBusinessUserOnlineStatus(targetUserID);
      userInfo = { ...userInfo, businessOnlineStatus: onlineStatus };
    } catch (error) {
      console.debug("get business user online status failed", targetUserID, error);
    }
    if (businessRoomId) {
      try {
        const memberPayload = unwrapFriendInfo(
          await getLegacyGroupMember({
            roomId: businessRoomId,
            targetUserId: targetUserID,
          }),
        );
        userInfo = {
          ...userInfo,
          ...memberPayload,
        };
      } catch (error) {
        console.debug("get legacy business group member failed", {
          roomId: businessRoomId,
          userID: targetUserID,
          error,
        });
      }
      try {
        const groupInviterInfo = getGroupInviterText(
          await getLegacyGroupMemberInviterInfo({
            roomId: businessRoomId,
            targetUserId: targetUserID,
          }),
        );
        if (groupInviterInfo) {
          userInfo = {
            ...userInfo,
            groupInviterInfo,
          };
        }
      } catch (error) {
        console.debug("get legacy group member inviter info failed", {
          roomId: businessRoomId,
          userID: targetUserID,
          error,
        });
      }
    }
    return {
      cardInfo: userInfo,
    };
  };

  const refreshData = (data?: { cardInfo: CardInfo | null }) => {
    if (!data) {
      return;
    }
    const { cardInfo } = data;

    setCardInfo(cardInfo!);
    setUserInfoRow(cardInfo!);
  };

  const {
    data: fullCardInfo,
    isLoading,
    refetch,
  } = useQuery(["userInfo", targetUserID, businessRoomId], getCardInfo, {
    enabled: isOverlayOpen && (Boolean(isSelf) || Boolean(targetUserID)),
    onSuccess: refreshData,
  });

  const latestFullCardInfo = useLatest(fullCardInfo);

  useEffect(() => {
    if (!isOverlayOpen) return;
    const friendAddedHandler = ({ data }: WSEvent<FriendUserItem>) => {
      if (isSameID(data.userID, targetUserID)) {
        refetch();
      }
    };
    IMSDK.on(CbEvents.OnFriendAdded, friendAddedHandler);
    refreshData(
      props.cardInfo
        ? { cardInfo: props.cardInfo }
        : latestFullCardInfo.current ?? undefined,
    );
    return () => {
      IMSDK.off(CbEvents.OnFriendAdded, friendAddedHandler);
    };
  }, [isOverlayOpen, props.cardInfo]);

  const refreshSelfInfo = useCallback(() => {
    const latestInfo = useUserStore.getState().selfInfo;
    setCardInfo(latestInfo);
    setUserInfoRow(latestInfo);
  }, [isSelf]);

  const updateCardRemark = (remark: string) => {
    setUserInfoRow({ ...cardInfo!, remark });
  };

  const updateCardPhoneRemark = (phoneRemark: string) => {
    setUserInfoRow({ ...cardInfo!, phoneRemark });
  };

  const setUserInfoRow = (info: CardInfo) => {
    let tmpFields = [] as FieldRow[];
    tmpFields.push({
      title: t("placeholder.nickName"),
      value: info.nickname || "",
    });
    const isFriend = info?.remark !== undefined;

    if (isFriend) {
      tmpFields.push({
        title: t("placeholder.remark"),
        value: info.remark || "-",
        editable: true,
      });
    }
    if (isFriend || isSelf) {
      const isOnline = getOnlineState(
        info.businessOnlineStatus as BusinessOnlineStatus | undefined,
      );
      tmpFields = [
        ...tmpFields,
        ...[
          ...(isOnline === undefined
            ? []
            : [
                {
                  title: t("placeholder.onlineStatus"),
                  value: isOnline ? t("placeholder.online") : t("placeholder.offLine"),
                },
              ]),
          {
            title: t("placeholder.gender"),
            value: getGender(info.gender!),
          },
          {
            title: t("placeholder.birth"),
            value: info.birth ? dayjs(info.birth).format("YYYY/M/D") : "-",
          },
          {
            title: t("placeholder.phoneNumber"),
            value: info.phoneNumber || "-",
          },
          ...(isFriend
            ? [
                {
                  title: t("placeholder.phoneRemark"),
                  value: getPhoneRemark(info) || "-",
                  editable: true,
                  editType: "phoneRemark" as const,
                },
              ]
            : []),
          {
            title: t("placeholder.email"),
            value: info.email || "-",
          },
        ],
      ];
    }
    if (info.groupInviterInfo) {
      tmpFields.push({
        title: t("placeholder.groupInviter"),
        value: String(info.groupInviterInfo),
      });
    }
    setUserFields(tmpFields);
  };

  const backToCard = () => {
    setIsSendRequest(false);
  };

  const trySendRequest = () => {
    if (!toBusinessText(cardInfo?.userID ?? targetUserID).trim()) {
      feedbackToast({ error: new Error(t("toast.sendApplicationFailed")) });
      return;
    }

    setIsSendRequest(true);
  };

  const reportUser = () => {
    if (!cardTargetUserID) {
      feedbackToast({ error: new Error(t("toast.sendApplicationFailed")) });
      return;
    }

    let reason = "";
    modal.confirm({
      title: t("placeholder.reportUser"),
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
            toUserId: cardTargetUserID,
            reportType: ReportTargetType.User,
            reportInfo: props.groupID ? `groupID:${props.groupID}` : undefined,
            reason: normalizedReason,
            webUrl: window.location.href,
          });
          feedbackToast();
        } catch (error) {
          feedbackToast({ error });
        }
      },
    });
  };

  const resetState = () => {
    setCardInfo(undefined);
    setUserFields([]);
    setIsSendRequest(false);
  };

  const cardTargetUserID = toBusinessText(cardInfo?.userID ?? targetUserID).trim();
  const showAddFriend =
    Boolean(cardInfo && cardTargetUserID) && !isFriendUser && !isSelf && !notAdd;

  return (
    <DraggableModalWrap
      title={null}
      footer={null}
      open={isOverlayOpen}
      closable={false}
      width={332}
      centered
      onCancel={closeOverlay}
      destroyOnClose
      styles={{
        mask: {
          opacity: 0,
          transition: "none",
        },
      }}
      afterClose={resetState}
      ignoreClasses=".ignore-drag, .no-padding-modal, .cursor-pointer"
      className="no-padding-modal"
      maskTransitionName=""
    >
      <Spin spinning={isLoading}>
        {isSendRequest ? (
          <SendRequest cardInfo={cardInfo!} backToCard={backToCard} />
        ) : (
          <div className="flex max-h-[520px] min-h-[484px] flex-col overflow-hidden bg-[url(@/assets/images/common/card_bg.png)] bg-[length:332px_134px] bg-no-repeat px-5.5">
            <div className="h-[104px] min-h-[104px] w-full cursor-move" />
            <div className="ignore-drag flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center">
                <OIMAvatar
                  size={60}
                  src={cardInfo?.faceURL}
                  text={cardInfo?.nickname}
                />
                <div className="ml-3 flex h-[60px] flex-1 flex-col justify-around overflow-hidden">
                  <div className="flex w-fit max-w-[80%] items-baseline">
                    <div
                      className="flex-1 select-text truncate text-base font-medium text-white"
                      title={cardInfo?.nickname}
                    >
                      {cardInfo?.nickname}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="mr-3 cursor-pointer text-xs text-[var(--sub-text)]"
                      onClick={() => {
                        copyToClipboard(cardInfo?.userID ?? "");
                        feedbackToast({ msg: t("toast.copySuccess") });
                      }}
                    >
                      {cardInfo?.userID}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <UserCardDataGroup
                  title={t("placeholder.personalInfo")}
                  userID={cardInfo?.userID}
                  fieldRows={userFields}
                  updateCardRemark={updateCardRemark}
                  updateCardPhoneRemark={updateCardPhoneRemark}
                />
              </div>
            </div>
            <div className="mx-1 mb-6 mt-3 flex items-center gap-2">
              {showAddFriend && (
                <Button
                  type="primary"
                  className="min-w-0 flex-1"
                  onClick={trySendRequest}
                >
                  {t("placeholder.addFriends")}
                </Button>
              )}
              {isSelf && (
                <Button
                  type="primary"
                  className="min-w-0 flex-1"
                  onClick={() => editInfoRef.current?.openOverlay()}
                >
                  {t("placeholder.editInfo")}
                </Button>
              )}
              {!isSelf && !notSendMessage && cardTargetUserID && (
                <Button
                  type="primary"
                  className="min-w-0 flex-1"
                  onClick={() =>
                    toSpecifiedConversation({
                      sourceID: cardTargetUserID,
                      sessionType: SessionType.Single,
                    }).then(closeOverlay)
                  }
                >
                  {t("placeholder.sendMessage")}
                </Button>
              )}
              {!isSelf && cardTargetUserID && (
                <Button danger className="min-w-0 flex-1" onClick={reportUser}>
                  {t("placeholder.report")}
                </Button>
              )}
            </div>
          </div>
        )}
      </Spin>
      <EditSelfInfo ref={editInfoRef} refreshSelfInfo={refreshSelfInfo} />
    </DraggableModalWrap>
  );
};

export default memo(forwardRef(UserCardModal));

interface IUserCardDataGroupProps {
  title: string;
  userID?: string;
  divider?: boolean;
  fieldRows: FieldRow[];
  updateCardRemark?: (remark: string) => void;
  updateCardPhoneRemark?: (phoneRemark: string) => void;
}

type EditableFieldType = "remark" | "phoneRemark";

type FieldRow = {
  title: string;
  value: string;
  editable?: boolean;
  editType?: EditableFieldType;
};

const UserCardDataGroup: FC<IUserCardDataGroupProps> = ({
  title,
  userID,
  divider,
  fieldRows,
  updateCardRemark,
  updateCardPhoneRemark,
}) => {
  const tryUpdateField = (fieldRow: FieldRow, value: string) => {
    const targetUserID = toBusinessText(userID).trim();

    if (!targetUserID) {
      feedbackToast({ error: new Error(t("toast.sendApplicationFailed")) });
      return;
    }

    const editType = fieldRow.editType ?? "remark";
    modal.confirm({
      title:
        editType === "phoneRemark"
          ? t("placeholder.phoneRemark")
          : t("placeholder.remark"),
      content:
        editType === "phoneRemark"
          ? t("placeholder.confirmUpdateFriendPhoneRemark")
          : t("placeholder.confirmUpdateFriendRemark"),
      onOk: async () => {
        try {
          if (editType === "phoneRemark") {
            await updateFriendPhoneRemark(targetUserID, value);
            updateCardPhoneRemark?.(value);
          } else {
            await updateFriendRemark(targetUserID, value);
            await IMSDK.updateFriends({
              friendUserIDs: [targetUserID],
              remark: value,
            });
            updateCardRemark?.(value);
          }
        } catch (error) {
          feedbackToast({ error });
        }
      },
    });
  };
  return (
    <div>
      <div className="my-4 text-[var(--sub-text)]">{title}</div>
      {fieldRows.map((fieldRow, idx) => (
        <div className="my-4 flex items-center text-xs" key={idx}>
          <div className="w-24 text-[var(--sub-text)]">{fieldRow.title}</div>
          {fieldRow.editable ? (
            <EditableContent
              className="!ml-0"
              textClassName="font-medium"
              value={fieldRow.value}
              editable={true}
              onChange={(value) => tryUpdateField(fieldRow, value)}
            />
          ) : (
            <div className="flex-1 select-text truncate">{fieldRow.value}</div>
          )}
        </div>
      ))}

      {divider && <Divider className="my-0 border-[var(--gap-text)]" />}
    </div>
  );
};
