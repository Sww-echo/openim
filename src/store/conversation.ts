import type {
  ConversationItem,
  GroupItem,
  GroupMemberItem,
} from "@openim/wasm-client-sdk/lib/types/entity";
import { t } from "i18next";
import { create } from "zustand";

import { getOpenIMGroupDetail, getOpenIMGroupMembers } from "@/api/group";
import { IMSDK } from "@/layout/MainContentWrap";
import {
  getBusinessListPayload,
  pickExplicitBusinessRoomId,
  pickBusinessText,
  type BusinessRecord,
} from "@/utils/businessPayload";
import { feedbackToast, isSameID } from "@/utils/common";
import { normalizeBusinessGroupMemberRoleLevel } from "@/utils/groupMember";
import { conversationSort, isGroupSession } from "@/utils/imCommon";

import { ConversationListUpdateType, ConversationStore } from "./type";
import { useUserStore } from "./user";

const CONVERSATION_SPLIT_COUNT = 500;

const asRecord = (value: unknown) =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const unwrapBusinessData = (response: unknown): Record<string, unknown> => {
  const data = asRecord(response).data ?? response;
  const record = asRecord(data);
  return asRecord(record.room ?? record.group ?? record.detail ?? data);
};

const normalizeBusinessGroupMember = (
  record: BusinessRecord,
  fallbackGroupID: string,
): Partial<GroupMemberItem> => ({
  ...record,
  userID: pickBusinessText(record, [
    "userID",
    "userId",
    "user_id",
    "openIMUserID",
    "openIMUserId",
  ]),
  groupID:
    pickBusinessText(record, ["groupID", "groupId", "roomId", "roomID"]) ||
    fallbackGroupID,
  nickname: pickBusinessText(record, [
    "nickname",
    "nickName",
    "name",
    "userName",
    "account",
  ]),
  faceURL: pickBusinessText(record, [
    "faceURL",
    "faceUrl",
    "avatar",
    "avatarUrl",
    "userFaceURL",
  ]),
  roleLevel: normalizeBusinessGroupMemberRoleLevel(record),
});

export const useConversationStore = create<ConversationStore>()((set, get) => ({
  conversationList: [],
  currentConversation: undefined,
  unReadCount: 0,
  currentGroupInfo: undefined,
  currentMemberInGroup: undefined,
  getConversationListByReq: async (isOffset?: boolean) => {
    let tmpConversationList = [] as ConversationItem[];
    try {
      const { data } = await IMSDK.getConversationListSplit({
        offset: isOffset ? get().conversationList.length : 0,
        count: CONVERSATION_SPLIT_COUNT,
      });
      tmpConversationList = data;
    } catch (error) {
      feedbackToast({ error, msg: t("toast.getConversationFailed") });
      return true;
    }
    set((state) => ({
      conversationList: [
        ...(isOffset ? state.conversationList : []),
        ...tmpConversationList,
      ],
    }));
    return tmpConversationList.length === CONVERSATION_SPLIT_COUNT;
  },
  updateConversationList: (
    list: ConversationItem[],
    type: ConversationListUpdateType,
  ) => {
    const idx = list.findIndex(
      (c) => c.conversationID === get().currentConversation?.conversationID,
    );
    if (idx > -1) get().updateCurrentConversation(list[idx]);

    if (type === "filter") {
      set((state) => ({
        conversationList: conversationSort(
          [...list, ...state.conversationList],
          state.conversationList,
        ),
      }));
      return;
    }
    let filterArr: ConversationItem[] = [];
    const chids = list.map((ch) => ch.conversationID);
    filterArr = get().conversationList.filter(
      (tc) => !chids.includes(tc.conversationID),
    );

    set(() => ({ conversationList: conversationSort([...list, ...filterArr]) }));
  },
  updateCurrentConversation: async (
    conversation?: ConversationItem,
    _isJump?: boolean,
  ) => {
    if (!conversation) {
      set(() => ({
        currentConversation: undefined,
        quoteMessage: undefined,
        currentGroupInfo: undefined,
        currentMemberInGroup: undefined,
      }));
      return;
    }
    const prevConversation = get().currentConversation;

    const toggleNewConversation =
      conversation.conversationID !== prevConversation?.conversationID;
    set(() => ({
      currentConversation: { ...conversation },
      ...(toggleNewConversation || !isGroupSession(conversation.conversationType)
        ? {
            currentGroupInfo: undefined,
            currentMemberInGroup: undefined,
          }
        : {}),
    }));

    if (toggleNewConversation && isGroupSession(conversation.conversationType)) {
      const businessRoomId =
        pickExplicitBusinessRoomId(
          conversation as unknown as BusinessRecord,
          conversation.groupID,
        ) || conversation.groupID;
      get().getCurrentGroupInfoByReq(conversation.groupID, businessRoomId);
      await get().getCurrentMemberInGroupByReq(conversation.groupID, businessRoomId);
    }
  },
  getUnReadCountByReq: async () => {
    try {
      const { data } = await IMSDK.getTotalUnreadMsgCount();
      set(() => ({ unReadCount: data }));
      return data;
    } catch (error) {
      console.error(error);
      return 0;
    }
  },
  updateUnReadCount: (count: number) => {
    set(() => ({ unReadCount: count }));
  },
  getCurrentGroupInfoByReq: async (groupID: string, businessRoomId?: string) => {
    let groupInfo: GroupItem;
    try {
      const { data } = await IMSDK.getSpecifiedGroupsInfo([groupID]);
      groupInfo = data[0];
      const resolvedBusinessRoomId =
        businessRoomId ||
        pickExplicitBusinessRoomId(groupInfo as unknown as BusinessRecord, groupID) ||
        groupID;
      if (resolvedBusinessRoomId) {
        try {
          const response = await getOpenIMGroupDetail({
            roomId: resolvedBusinessRoomId,
          });
          groupInfo = {
            ...groupInfo,
            ...unwrapBusinessData(response),
          };
        } catch (error) {
          console.debug("getOpenIMGroupDetail failed", error);
        }
      }
    } catch (error) {
      feedbackToast({ error, msg: t("toast.getGroupInfoFailed") });
      return;
    }
    set(() => ({ currentGroupInfo: { ...groupInfo } }));
  },
  updateCurrentGroupInfo: (groupInfo: GroupItem) => {
    set(() => ({ currentGroupInfo: { ...groupInfo } }));
  },
  getCurrentMemberInGroupByReq: async (groupID: string, businessRoomId?: string) => {
    let memberInfo: GroupMemberItem;
    const selfID = useUserStore.getState().selfInfo.userID;
    try {
      const { data } = await IMSDK.getSpecifiedGroupMembersInfo({
        groupID,
        userIDList: [selfID],
      });
      memberInfo = data[0];
      const resolvedBusinessRoomId = businessRoomId || groupID;
      if (resolvedBusinessRoomId) {
        try {
          const businessResponse = await getOpenIMGroupMembers({
            roomId: resolvedBusinessRoomId,
            keyword: selfID,
            pageIndex: 0,
            pageSize: 100,
          });
          const businessMember = getBusinessListPayload(businessResponse)
            .map((record) => normalizeBusinessGroupMember(record, groupID))
            .find((record) => isSameID(record.userID, selfID));

          if (businessMember) {
            const compactBusinessMember = Object.fromEntries(
              Object.entries(businessMember).filter(
                ([, value]) => value !== undefined && value !== "",
              ),
            ) as Partial<GroupMemberItem>;
            memberInfo = {
              ...memberInfo,
              ...compactBusinessMember,
            };
          }
        } catch (error) {
          console.debug("getOpenIMGroupMembers current member failed", error);
        }
      }
    } catch (error) {
      set(() => ({ currentMemberInGroup: undefined }));
      feedbackToast({ error, msg: t("toast.getGroupMemberFailed") });
      return;
    }
    set(() => ({ currentMemberInGroup: memberInfo ? { ...memberInfo } : undefined }));
  },
  setCurrentMemberInGroup: (memberInfo?: GroupMemberItem) => {
    set(() => ({ currentMemberInGroup: memberInfo }));
  },
  tryUpdateCurrentMemberInGroup: (member: GroupMemberItem) => {
    const currentMemberInGroup = get().currentMemberInGroup;
    if (
      isSameID(member.groupID, currentMemberInGroup?.groupID) &&
      isSameID(member.userID, currentMemberInGroup?.userID)
    ) {
      set(() => ({ currentMemberInGroup: { ...member } }));
    }
  },
  clearConversationStore: () => {
    set(() => ({
      conversationList: [],
      currentConversation: undefined,
      unReadCount: 0,
      currentGroupInfo: undefined,
      currentMemberInGroup: undefined,
      quoteMessage: undefined,
    }));
  },
}));
