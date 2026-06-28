import { GroupMemberRole } from "@openim/wasm-client-sdk";
import { GroupMemberItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { useLatest } from "ahooks";
import { useCallback, useEffect, useState } from "react";

import { getOpenIMGroupMembers } from "@/api/group";
import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore } from "@/store";
import { BusinessRecord, pickExplicitBusinessRoomId } from "@/utils/businessPayload";
import { isSameID } from "@/utils/common";
import emitter from "@/utils/events";
import { normalizeBusinessGroupMemberRoleLevel } from "@/utils/groupMember";

export interface FetchStateType {
  offset: number;
  count: number;
  loading: boolean;
  hasMore: boolean;
  groupMemberList: GroupMemberItem[];
}

interface UseGroupMembersProps {
  groupID?: string;
  roomId?: string | number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const unwrapPayload = (value: unknown): unknown => {
  let current = value;
  const seen = new Set<unknown>();

  while (isRecord(current) && !seen.has(current)) {
    seen.add(current);
    const currentRecord = current;
    const wrapperKey = ["data", "result", "obj"].find(
      (key) => currentRecord[key] !== undefined && currentRecord[key] !== null,
    );
    if (!wrapperKey) {
      break;
    }
    current = currentRecord[wrapperKey];
  }

  return current;
};

const getListPayload = (value: unknown): unknown[] => {
  const payload = unwrapPayload(value);

  if (Array.isArray(payload)) {
    return payload;
  }
  if (!isRecord(payload)) {
    return [];
  }

  const listValue = ["list", "records", "rows", "items", "members"].find((key) =>
    Array.isArray(payload[key]),
  );

  return listValue ? (payload[listValue] as unknown[]) : [];
};

const toStringValue = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const normalizeBusinessMember = (
  value: unknown,
  fallbackGroupID: string,
): GroupMemberItem => {
  const record = isRecord(value) ? value : {};
  const userID = toStringValue(
    record.userID ?? record.userId ?? record.user_id ?? record.openIMUserID,
  );
  const groupID =
    toStringValue(record.groupID ?? record.groupId ?? record.roomId) || fallbackGroupID;
  const nickname = toStringValue(
    record.nickname ?? record.nickName ?? record.name ?? record.account,
  );
  const faceURL = toStringValue(
    record.faceURL ?? record.faceUrl ?? record.avatar ?? record.avatarUrl,
  );

  return {
    ...record,
    userID,
    groupID,
    nickname,
    faceURL,
    roleLevel: normalizeBusinessGroupMemberRoleLevel(record, GroupMemberRole.Normal),
  } as GroupMemberItem;
};

const getSDKGroupMembers = async (
  groupID: string,
  pageIndex: number,
  count: number,
) => {
  const { data } = await IMSDK.getGroupMemberList({
    groupID,
    filter: 0,
    offset: pageIndex * count,
    count,
  });

  return data ?? [];
};

const mergeMembersByUserID = (members: GroupMemberItem[]) => {
  const memberMap = new Map<string, GroupMemberItem>();

  members.forEach((member) => {
    if (!member.userID) {
      return;
    }
    memberMap.set(member.userID, {
      ...memberMap.get(member.userID),
      ...member,
    });
  });

  return [...memberMap.values()];
};

export default function useGroupMembers(props?: UseGroupMembersProps) {
  const { groupID, roomId } = props ?? {};
  const [fetchState, setFetchState] = useState<FetchStateType>({
    offset: 0,
    count: 20,
    loading: false,
    hasMore: true,
    groupMemberList: [],
  });
  const latestFetchState = useLatest(fetchState);

  const getMemberData = useCallback(
    async (refresh = false) => {
      const { currentConversation, currentGroupInfo } = useConversationStore.getState();
      const sourceID =
        groupID ?? currentConversation?.groupID ?? currentGroupInfo?.groupID ?? "";
      if (!sourceID) return;
      const explicitBusinessRoomId = pickExplicitBusinessRoomId(
        currentGroupInfo as BusinessRecord | undefined,
        roomId ?? groupID ?? currentConversation?.groupID,
      );
      const businessRoomId = explicitBusinessRoomId || sourceID;
      const latestState = latestFetchState.current ?? fetchState;

      if ((latestState.loading || !latestState.hasMore) && !refresh) return;

      setFetchState((state) => ({
        ...state,
        loading: true,
      }));
      const count = 100;
      const pageIndex = refresh ? 0 : Math.floor(latestState.offset / count);
      let businessData: GroupMemberItem[] = [];

      if (businessRoomId) {
        try {
          const response = await getOpenIMGroupMembers({
            roomId: businessRoomId,
            pageIndex,
            pageSize: count,
          });
          businessData = mergeMembersByUserID(
            getListPayload(response).map((item) =>
              normalizeBusinessMember(item, sourceID),
            ),
          );
        } catch (businessError) {
          console.debug("Skipped business group members list", businessError);
        }
      }

      try {
        const sdkData = await getSDKGroupMembers(sourceID, pageIndex, count);
        const data = mergeMembersByUserID([...sdkData, ...businessData]);

        setFetchState((state) => ({
          ...state,
          groupMemberList: mergeMembersByUserID([
            ...(refresh ? [] : state.groupMemberList),
            ...data,
          ]),
          hasMore: sdkData.length === count || businessData.length === count,
          offset: refresh ? data.length : state.offset + data.length,
          loading: false,
        }));
      } catch (sdkError) {
        console.debug("Skipped SDK group members list", sdkError);
        if (businessData.length > 0 || explicitBusinessRoomId || pageIndex > 0) {
          setFetchState((state) => ({
            ...state,
            groupMemberList: mergeMembersByUserID([
              ...(refresh ? [] : state.groupMemberList),
              ...businessData,
            ]),
            hasMore: businessData.length === count,
            offset: refresh ? businessData.length : state.offset + businessData.length,
            loading: false,
          }));
          return;
        }

        setFetchState((state) => ({
          ...state,
          groupMemberList: refresh ? [] : state.groupMemberList,
          hasMore: false,
          loading: false,
        }));
      }
    },
    [fetchState, groupID, latestFetchState, roomId],
  );

  const resetState = () => {
    setFetchState({
      offset: 0,
      count: 20,
      loading: false,
      hasMore: true,
      groupMemberList: [],
    });
  };

  useEffect(() => {
    const refreshGroupMembers = () => {
      void getMemberData(true);
    };

    emitter.on("REFRESH_GROUP_MEMBERS", refreshGroupMembers);
    return () => {
      emitter.off("REFRESH_GROUP_MEMBERS", refreshGroupMembers);
    };
  }, [getMemberData]);

  const updateMemberInState = (
    userID: string,
    patch: Partial<GroupMemberItem> & Record<string, unknown>,
  ) => {
    setFetchState((state) => ({
      ...state,
      groupMemberList: state.groupMemberList.map((member) =>
        isSameID(member.userID, userID) ? { ...member, ...patch } : member,
      ),
    }));
  };

  return {
    fetchState,
    getMemberData,
    resetState,
    updateMemberInState,
  };
}
