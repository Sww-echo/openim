import { ApplicationHandleResult } from "@openim/wasm-client-sdk";
import {
  BlackUserItem,
  FriendApplicationItem,
  FriendUserItem,
  GroupApplicationItem,
  GroupItem,
} from "@openim/wasm-client-sdk/lib/types/entity";
import { t } from "i18next";
import { create } from "zustand";

import {
  getBusinessBlacklist,
  getFriendList,
  getLegacyBusinessBlacklist,
  getLegacyNewFriendList,
  getNewFriendList,
} from "@/api/friend";
import { getOpenIMJoinRequests } from "@/api/group";
import { IMSDK } from "@/layout/MainContentWrap";
import {
  BusinessRecord,
  getBusinessListPayload,
  isBusinessRecord,
  pickBusinessJoinRequestId,
  pickBusinessNumber,
  pickBusinessRoomId,
  pickBusinessText,
} from "@/utils/businessPayload";
import { feedbackToast, isSameID, normalizeID } from "@/utils/common";
import { getIMUserID } from "@/utils/storage";

import { ContactStore } from "./type";

const getNestedBusinessRecord = (record: BusinessRecord, keys: string[]) =>
  keys.map((key) => record[key]).filter(isBusinessRecord);

const pickBusinessTextDeep = (record: BusinessRecord, keys: string[]) =>
  [record, ...getNestedBusinessRecord(record, ["friend", "friendInfo", "friendUser"])]
    .map((item) => pickBusinessText(item, keys))
    .find(Boolean) ?? "";

const pickBusinessCardValue = (record: BusinessRecord, type: string) => {
  const cards = record.profileCards;
  if (!Array.isArray(cards)) {
    return "";
  }

  const card = cards.find(
    (item): item is BusinessRecord =>
      isBusinessRecord(item) && pickBusinessText(item, ["type"]) === type,
  );

  return card ? pickBusinessText(card, ["value"]) : "";
};

const toFriendUserItem = (record: BusinessRecord) => {
  const userID =
    pickBusinessText(record, [
      "toUserId",
      "toUserID",
      "friendUserId",
      "friendUserID",
      "openIMUserID",
      "openIMUserId",
      "openimUserID",
      "openimUserId",
    ]) ||
    pickBusinessTextDeep(record, ["userID", "userId", "id"]) ||
    pickBusinessText(record, ["userID", "userId", "id"]);

  if (!userID) {
    return undefined;
  }

  return {
    ...record,
    userID,
    nickname:
      pickBusinessTextDeep(record, [
        "toNickname",
        "toNickName",
        "displayTitle",
        "friendNickname",
        "friendNickName",
        "friendName",
        "nickname",
        "nickName",
        "userName",
        "account",
        "communicationNo",
        "name",
        "remarkName",
        "showName",
        "displayName",
      ]) || pickBusinessCardValue(record, "nickname"),
    faceURL:
      pickBusinessTextDeep(record, [
        "toFaceURL",
        "toFaceUrl",
        "friendFaceURL",
        "friendFaceUrl",
        "friendAvatar",
        "faceURL",
        "faceUrl",
        "avatar",
        "avatarUrl",
        "headimgurl",
        "headImgUrl",
      ]) || pickBusinessCardValue(record, "avatar"),
    remark: pickBusinessTextDeep(record, [
      "remark",
      "remarkName",
      "friendRemark",
      "friendRemarkName",
    ]),
  } as FriendUserItem;
};

const toBlackUserItem = (record: BusinessRecord) => {
  const userID = pickBusinessText(record, [
    "userID",
    "userId",
    "toUserId",
    "friendUserId",
    "id",
  ]);

  if (!userID) {
    return undefined;
  }

  return {
    ...record,
    userID,
    nickname: pickBusinessText(record, ["nickname", "nickName", "name", "remarkName"]),
    faceURL: pickBusinessText(record, [
      "faceURL",
      "faceUrl",
      "avatar",
      "headimgurl",
      "headImgUrl",
    ]),
  } as BlackUserItem;
};

const toFriendApplicationItem = (record: BusinessRecord, currentUserID: string) => {
  const rawFromUserID = pickBusinessText(record, [
    "fromUserID",
    "fromUserId",
    "applyUserId",
    "applicantUserId",
    "userId",
    "userID",
  ]);
  const rawToUserID = pickBusinessText(record, [
    "toUserID",
    "toUserId",
    "targetUserId",
    "friendUserId",
  ]);

  if (!rawFromUserID && !rawToUserID) {
    return undefined;
  }

  const fromUserID = rawFromUserID || currentUserID;
  const toUserID = rawToUserID || currentUserID;
  const createTime =
    pickBusinessNumber(record, ["createTime", "createdAt", "time", "modifyTime"]) ??
    Date.now();

  return {
    ...record,
    fromUserID,
    toUserID,
    fromNickname: pickBusinessTextDeep(record, [
      "fromNickname",
      "fromNickName",
      "displayTitle",
      "nickname",
      "nickName",
      "name",
    ]),
    toNickname: pickBusinessTextDeep(record, [
      "toNickname",
      "toNickName",
      "targetNickname",
      "displaySubtitle",
    ]),
    fromFaceURL: pickBusinessText(record, [
      "fromFaceURL",
      "fromFaceUrl",
      "faceURL",
      "faceUrl",
      "avatar",
    ]),
    toFaceURL: pickBusinessText(record, ["toFaceURL", "toFaceUrl", "targetFaceURL"]),
    reqMsg: pickBusinessText(record, ["reqMsg", "reason", "remark", "message"]),
    handleResult: getBusinessApplicationHandleResult(record),
    createTime,
  } as FriendApplicationItem;
};

const getBusinessApplicationHandleResult = (record: BusinessRecord) => {
  const status = pickBusinessNumber(record, [
    "handleResult",
    "status",
    "state",
    "auditStatus",
    "applyStatus",
  ]);
  const statusText = pickBusinessText(record, [
    "action",
    "statusText",
    "stateText",
    "handleStatus",
    "badgeText",
  ]).toLowerCase();

  if (
    status === ApplicationHandleResult.Agree ||
    status === 1 ||
    statusText.includes("approve") ||
    statusText.includes("agree") ||
    statusText.includes("好友") ||
    statusText.includes("friend")
  ) {
    return ApplicationHandleResult.Agree;
  }
  if (
    status === ApplicationHandleResult.Reject ||
    status === 3 ||
    statusText.includes("reject") ||
    statusText.includes("refuse")
  ) {
    return ApplicationHandleResult.Reject;
  }
  if (status === 2) {
    return ApplicationHandleResult.Agree;
  }
  return ApplicationHandleResult.Unprocessed;
};

const toGroupApplicationItem = (record: BusinessRecord, fallbackGroup?: GroupItem) => {
  const groupID =
    pickBusinessText(record, [
      "groupID",
      "groupId",
      "openIMGroupID",
      "openIMGroupId",
      "roomId",
      "roomID",
      "jid",
      "roomJid",
    ]) || fallbackGroup?.groupID;
  const userID = pickBusinessText(record, [
    "userID",
    "userId",
    "fromUserID",
    "fromUserId",
    "applyUserId",
    "applyUserID",
    "applicantUserId",
    "applicantUserID",
    "requestUserId",
    "requestUserID",
  ]);

  if (!groupID || !userID) {
    return undefined;
  }

  const requestId = pickBusinessJoinRequestId(record);
  const reqTime =
    pickBusinessNumber(record, [
      "reqTime",
      "createTime",
      "createdAt",
      "applyTime",
      "requestTime",
      "time",
    ]) ?? Date.now();

  return {
    ...record,
    requestId,
    groupID,
    roomId: pickBusinessRoomId(record, groupID),
    userID,
    nickname: pickBusinessText(record, [
      "nickname",
      "nickName",
      "userName",
      "applyUserName",
      "applicantName",
      "fromNickname",
      "fromNickName",
      "account",
    ]),
    userFaceURL: pickBusinessText(record, [
      "userFaceURL",
      "userFaceUrl",
      "fromFaceURL",
      "fromFaceUrl",
      "faceURL",
      "faceUrl",
      "avatar",
      "headimgurl",
      "headImgUrl",
    ]),
    groupName:
      pickBusinessText(record, ["groupName", "roomName", "subject", "name"]) ||
      fallbackGroup?.groupName,
    groupFaceURL:
      pickBusinessText(record, [
        "groupFaceURL",
        "groupFaceUrl",
        "roomAvatar",
        "avatarUrl",
      ]) || fallbackGroup?.faceURL,
    reqMsg: pickBusinessText(record, [
      "reqMsg",
      "applyReason",
      "reason",
      "remark",
      "message",
    ]),
    handleResult: getBusinessApplicationHandleResult(record),
    reqTime,
  } as unknown as GroupApplicationItem;
};

const mergeByUserID = <T extends { userID: string }>(base: T[], business: T[]) => {
  const itemMap = new Map<string, T>();

  base.forEach((item) => itemMap.set(normalizeID(item.userID), item));
  business.forEach((item) => {
    const userID = normalizeID(item.userID);
    const meaningfulBusinessItem = Object.fromEntries(
      Object.entries(item).filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      ),
    ) as T;
    itemMap.set(userID, {
      ...itemMap.get(userID),
      ...meaningfulBusinessItem,
    });
  });

  return [...itemMap.values()];
};

const getGroupApplicationKey = (item: GroupApplicationItem, currentUserID: string) => {
  const direction = isSameID(item.userID, currentUserID) ? "send" : "recv";
  const groupID = normalizeID(item.groupID);
  const userID = normalizeID(item.userID);

  if (groupID || userID) {
    return `${direction}:${groupID}:${userID}`;
  }

  const requestId = pickBusinessJoinRequestId(item as BusinessRecord);
  return `${direction}:request:${requestId ?? item.reqTime}`;
};

const getApplicationKey = (item: FriendApplicationItem, currentUserID: string) =>
  isSameID(item.fromUserID, currentUserID)
    ? `send:${item.toUserID}`
    : `recv:${item.fromUserID}`;

const mergeApplications = (
  base: FriendApplicationItem[],
  business: FriendApplicationItem[],
  currentUserID: string,
) => {
  const itemMap = new Map<string, FriendApplicationItem>();

  business.forEach((item) => itemMap.set(getApplicationKey(item, currentUserID), item));
  base.forEach((item) => itemMap.set(getApplicationKey(item, currentUserID), item));

  return [...itemMap.values()];
};

const mergeGroupApplications = (
  base: GroupApplicationItem[],
  business: GroupApplicationItem[],
  currentUserID: string,
) => {
  const itemMap = new Map<string, GroupApplicationItem>();

  base.forEach((item) =>
    itemMap.set(getGroupApplicationKey(item, currentUserID), item),
  );
  business.forEach((item) => {
    const key = getGroupApplicationKey(item, currentUserID);
    itemMap.set(key, {
      ...itemMap.get(key),
      ...item,
    });
  });

  return [...itemMap.values()];
};

type ContactLoadKey =
  | "friendList"
  | "groupList"
  | "friendApplications"
  | "groupApplications";

const contactLoadPromises: Partial<Record<ContactLoadKey, Promise<boolean>>> = {};

const loadBusinessFriendApplications = async () => {
  const currentUserID = String((await getIMUserID()) ?? "");
  if (!currentUserID) {
    return {
      currentUserID,
      applications: [] as FriendApplicationItem[],
    };
  }

  const responses = await Promise.allSettled([
    getNewFriendList({ pageIndex: 0, pageSize: 100 }),
    getLegacyNewFriendList({ pageIndex: 0, pageSize: 100 }),
  ]);
  const applications = responses
    .flatMap((result) =>
      result.status === "fulfilled" ? getBusinessListPayload(result.value) : [],
    )
    .map((record) => toFriendApplicationItem(record, currentUserID))
    .filter((item): item is FriendApplicationItem => Boolean(item));

  return {
    currentUserID,
    applications,
  };
};

const loadBusinessGroupApplications = async (groups: GroupItem[]) => {
  const currentUserID = String((await getIMUserID()) ?? "");
  if (!currentUserID || groups.length === 0) {
    return {
      currentUserID,
      applications: [] as GroupApplicationItem[],
    };
  }

  const applicationGroups = await Promise.all(
    groups.map(async (group) => {
      const roomId = pickBusinessRoomId(group as BusinessRecord, group.groupID);

      if (!roomId) {
        return [] as GroupApplicationItem[];
      }

      try {
        const response = await getOpenIMJoinRequests({
          roomId,
          pageIndex: 0,
          pageSize: 100,
        });

        return getBusinessListPayload(response)
          .map((record) => toGroupApplicationItem(record, group))
          .filter((item): item is GroupApplicationItem => Boolean(item));
      } catch (error) {
        console.debug("Skipped business group applications fallback", error);
        return [] as GroupApplicationItem[];
      }
    }),
  );

  return {
    currentUserID,
    applications: applicationGroups.flat(),
  };
};

export const useContactStore = create<ContactStore>()((set, get) => ({
  friendList: [],
  blackList: [],
  groupList: [],
  recvFriendApplicationList: [],
  sendFriendApplicationList: [],
  recvGroupApplicationList: [],
  sendGroupApplicationList: [],
  unHandleFriendApplicationCount: 0,
  unHandleGroupApplicationCount: 0,
  contactDataLoaded: {
    friendList: false,
    groupList: false,
    friendApplications: false,
    groupApplications: false,
  },
  contactDataLoading: {
    friendList: false,
    groupList: false,
    friendApplications: false,
    groupApplications: false,
  },
  ensureFriendListLoaded: async (force = false) => {
    if (!force && get().contactDataLoaded.friendList) {
      return true;
    }
    if (!force && contactLoadPromises.friendList) {
      return contactLoadPromises.friendList;
    }

    contactLoadPromises.friendList = (async () => {
      set((state) => ({
        contactDataLoading: {
          ...state.contactDataLoading,
          friendList: true,
        },
      }));
      try {
        const loaded = await get().getFriendListByReq();
        if (loaded) {
          set((state) => ({
            contactDataLoaded: {
              ...state.contactDataLoaded,
              friendList: true,
            },
          }));
        }
        return loaded;
      } finally {
        set((state) => ({
          contactDataLoading: {
            ...state.contactDataLoading,
            friendList: false,
          },
        }));
        contactLoadPromises.friendList = undefined;
      }
    })();

    return contactLoadPromises.friendList;
  },
  ensureGroupListLoaded: async (force = false) => {
    if (!force && get().contactDataLoaded.groupList) {
      return true;
    }
    if (!force && contactLoadPromises.groupList) {
      return contactLoadPromises.groupList;
    }

    contactLoadPromises.groupList = (async () => {
      set((state) => ({
        contactDataLoading: {
          ...state.contactDataLoading,
          groupList: true,
        },
      }));
      try {
        const loaded = await get().getGroupListByReq();
        if (loaded) {
          set((state) => ({
            contactDataLoaded: {
              ...state.contactDataLoaded,
              groupList: true,
            },
          }));
        }
        return loaded;
      } finally {
        set((state) => ({
          contactDataLoading: {
            ...state.contactDataLoading,
            groupList: false,
          },
        }));
        contactLoadPromises.groupList = undefined;
      }
    })();

    return contactLoadPromises.groupList;
  },
  ensureFriendApplicationsLoaded: async (force = false) => {
    if (!force && get().contactDataLoaded.friendApplications) {
      return true;
    }
    if (!force && contactLoadPromises.friendApplications) {
      return contactLoadPromises.friendApplications;
    }

    contactLoadPromises.friendApplications = (async () => {
      set((state) => ({
        contactDataLoading: {
          ...state.contactDataLoading,
          friendApplications: true,
        },
      }));
      try {
        const results = await Promise.all([
          get().getRecvFriendApplicationListByReq(),
          get().getSendFriendApplicationListByReq(),
        ]);
        const loaded = results.some(Boolean);
        if (loaded) {
          set((state) => ({
            contactDataLoaded: {
              ...state.contactDataLoaded,
              friendApplications: true,
            },
          }));
        }
        return loaded;
      } finally {
        set((state) => ({
          contactDataLoading: {
            ...state.contactDataLoading,
            friendApplications: false,
          },
        }));
        contactLoadPromises.friendApplications = undefined;
      }
    })();

    return contactLoadPromises.friendApplications;
  },
  ensureGroupApplicationsLoaded: async (force = false) => {
    if (!force && get().contactDataLoaded.groupApplications) {
      return true;
    }
    if (!force && contactLoadPromises.groupApplications) {
      return contactLoadPromises.groupApplications;
    }

    contactLoadPromises.groupApplications = (async () => {
      set((state) => ({
        contactDataLoading: {
          ...state.contactDataLoading,
          groupApplications: true,
        },
      }));
      try {
        const groupListLoaded = await get().ensureGroupListLoaded(force);
        const results = await Promise.all([
          get().getRecvGroupApplicationListByReq(),
          get().getSendGroupApplicationListByReq(),
        ]);
        const loaded = groupListLoaded || results.some(Boolean);
        if (loaded) {
          set((state) => ({
            contactDataLoaded: {
              ...state.contactDataLoaded,
              groupApplications: true,
            },
          }));
        }
        return loaded;
      } finally {
        set((state) => ({
          contactDataLoading: {
            ...state.contactDataLoading,
            groupApplications: false,
          },
        }));
        contactLoadPromises.groupApplications = undefined;
      }
    })();

    return contactLoadPromises.groupApplications;
  },
  getFriendListByReq: async () => {
    let offset = 0;
    let tmpList = [] as FriendUserItem[];
    let initialFetch = true;
    let hasLoadedSource = false;
    let lastError: unknown;

    try {
      // eslint-disable-next-line
      while (true) {
        const count = initialFetch ? 10000 : 1000;
        const { data } = await IMSDK.getFriendListPage({
          offset,
          count,
          filterBlack: true,
        });
        tmpList = [...tmpList, ...data];
        offset += count;
        if (data.length < count) break;
        initialFetch = false;
      }
      hasLoadedSource = true;
    } catch (error) {
      lastError = error;
      console.debug("Skipped SDK friend list", error);
    }

    try {
      const businessResponse = await getFriendList();
      const businessList = getBusinessListPayload(businessResponse)
        .map(toFriendUserItem)
        .filter((item): item is FriendUserItem => Boolean(item));
      tmpList = mergeByUserID(tmpList, businessList);
      hasLoadedSource = true;
    } catch (error) {
      lastError = error;
      console.debug("Failed to sync business friend list", error);
    }

    if (!hasLoadedSource) {
      feedbackToast({ error: lastError, msg: t("toast.getFriendListFailed") });
      return false;
    }

    set(() => ({
      friendList: [...tmpList],
    }));
    return true;
  },
  setFriendList: (list: FriendUserItem[]) => {
    set(() => ({ friendList: list }));
  },
  updateFriend: (friend: FriendUserItem, remove?: boolean) => {
    const tmpList = [...get().friendList];
    const idx = tmpList.findIndex((f) => isSameID(f.userID, friend.userID));
    if (idx < 0) {
      return;
    }
    if (remove) {
      tmpList.splice(idx, 1);
    } else {
      tmpList[idx] = { ...friend };
    }
    set(() => ({ friendList: tmpList }));
  },
  pushNewFriend: (friend: FriendUserItem) => {
    set((state) => ({ friendList: [...state.friendList, friend] }));
  },
  getBlackListByReq: async () => {
    try {
      const { data } = await IMSDK.getBlackList();
      let tmpList = [...data];

      try {
        const businessResponses = await Promise.allSettled([
          getBusinessBlacklist({
            pageIndex: 0,
            pageSize: 100,
          }),
          getLegacyBusinessBlacklist({
            pageIndex: 0,
            pageSize: 100,
          }),
        ]);
        const businessList = businessResponses
          .flatMap((result) =>
            result.status === "fulfilled" ? getBusinessListPayload(result.value) : [],
          )
          .map(toBlackUserItem)
          .filter((item): item is BlackUserItem => Boolean(item));
        tmpList = mergeByUserID(tmpList, businessList);
      } catch (error) {
        console.debug("Failed to sync business blacklist", error);
      }

      set(() => ({ blackList: tmpList }));
    } catch (error) {
      feedbackToast({ error, msg: t("toast.getBlackListFailed") });
    }
  },
  updateBlack: (black: BlackUserItem, remove?: boolean) => {
    const tmpList = [...get().blackList];
    const idx = tmpList.findIndex((b) => isSameID(b.userID, black.userID));
    if (idx < 0) {
      return;
    }
    if (remove) {
      tmpList.splice(idx, 1);
    } else {
      tmpList[idx] = { ...black };
    }
    set(() => ({ blackList: tmpList }));
  },
  pushNewBlack: (black: BlackUserItem) => {
    const isFriend = get().friendList.find((f) => isSameID(f.userID, black.userID));
    set((state) => ({
      blackList: [...state.blackList, black],
      friendList: !isFriend
        ? state.friendList
        : state.friendList.filter((f) => !isSameID(f.userID, black.userID)),
    }));
  },
  getGroupListByReq: async () => {
    let tmpList = [] as GroupItem[];
    let hasLoadedSource = false;
    let lastError: unknown;

    try {
      let offset = 0;
      // eslint-disable-next-line
      while (true) {
        const { data } = await IMSDK.getJoinedGroupListPage({ offset, count: 1000 });
        tmpList = [...tmpList, ...data];
        offset += 1000;
        if (data.length < 1000) break;
      }
      hasLoadedSource = true;
    } catch (error) {
      lastError = error;
      console.debug("Skipped SDK group list", error);
    }

    if (!hasLoadedSource) {
      feedbackToast({ error: lastError, msg: t("toast.getGroupListFailed") });
      return false;
    }

    // const { data } = await IMSDK.getJoinedGroupList();
    set(() => ({ groupList: tmpList }));
    return true;
  },
  setGroupList: (list: GroupItem[]) => {
    set(() => ({ groupList: list }));
  },
  updateGroup: (group: GroupItem, remove?: boolean) => {
    const tmpList = [...get().groupList];
    const idx = tmpList.findIndex((g) => isSameID(g.groupID, group.groupID));
    if (idx < 0) {
      return;
    }
    if (remove) {
      tmpList.splice(idx, 1);
    } else {
      tmpList[idx] = { ...group };
    }
    set(() => ({ groupList: tmpList }));
  },
  pushNewGroup: (group: GroupItem) => {
    set((state) => ({ groupList: [...state.groupList, group] }));
  },
  getRecvFriendApplicationListByReq: async () => {
    let tmpList = [] as FriendApplicationItem[];
    let hasLoadedSource = false;
    try {
      const { data } = await IMSDK.getFriendApplicationListAsRecipient();
      tmpList = [...data];
      hasLoadedSource = true;
    } catch (error) {
      console.debug("Skipped SDK received friend application list", error);
    }

    try {
      const { applications, currentUserID } = await loadBusinessFriendApplications();
      if (currentUserID) {
        hasLoadedSource = true;
      }
      tmpList = mergeApplications(
        tmpList,
        applications.filter((item) => !isSameID(item.fromUserID, currentUserID)),
        currentUserID,
      );
    } catch (error) {
      console.debug("Skipped business received friend application list", error);
    }

    if (!hasLoadedSource) {
      return false;
    }

    set(() => ({
      recvFriendApplicationList: tmpList,
      unHandleFriendApplicationCount: tmpList.filter(
        (application) =>
          application.handleResult === ApplicationHandleResult.Unprocessed,
      ).length,
    }));
    return true;
  },
  updateRecvFriendApplication: (application: FriendApplicationItem) => {
    let tmpList = [...get().recvFriendApplicationList];
    let isHandleResultUpdate = false;
    const idx = tmpList.findIndex((a) =>
      isSameID(a.fromUserID, application.fromUserID),
    );
    if (idx < 0) {
      tmpList = [...tmpList, application];
    } else {
      isHandleResultUpdate = true;
      tmpList[idx] = { ...application };
    }
    if (idx < 0 || isHandleResultUpdate) {
      const unHandleFriendApplicationCount = tmpList.filter(
        (application) => application.handleResult === 0,
      ).length;
      set(() => ({
        recvFriendApplicationList: tmpList,
        unHandleFriendApplicationCount,
      }));
      return Promise.resolve();
    }
    set(() => ({ recvFriendApplicationList: tmpList }));
    return Promise.resolve();
  },
  getSendFriendApplicationListByReq: async () => {
    let tmpList = [] as FriendApplicationItem[];
    let hasLoadedSource = false;
    try {
      const { data } = await IMSDK.getFriendApplicationListAsApplicant();
      tmpList = [...data];
      hasLoadedSource = true;
    } catch (error) {
      console.debug("Skipped SDK sent friend application list", error);
    }

    try {
      const { applications, currentUserID } = await loadBusinessFriendApplications();
      if (currentUserID) {
        hasLoadedSource = true;
      }
      tmpList = mergeApplications(
        tmpList,
        applications.filter((item) => isSameID(item.fromUserID, currentUserID)),
        currentUserID,
      );
    } catch (error) {
      console.debug("Skipped business sent friend application list", error);
    }

    if (!hasLoadedSource) {
      return false;
    }

    set(() => ({ sendFriendApplicationList: tmpList }));
    return true;
  },
  updateSendFriendApplication: (application: FriendApplicationItem) => {
    let tmpList = [...get().sendFriendApplicationList];
    const idx = tmpList.findIndex((a) => isSameID(a.toUserID, application.toUserID));
    if (idx < 0) {
      tmpList = [...tmpList, application];
    } else {
      tmpList[idx] = { ...application };
    }
    set(() => ({ sendFriendApplicationList: tmpList }));
  },
  getRecvGroupApplicationListByReq: async () => {
    let tmpList = [] as GroupApplicationItem[];
    let hasLoadedSource = false;
    try {
      const { data } = await IMSDK.getGroupApplicationListAsRecipient();
      tmpList = [...data];
      hasLoadedSource = true;
    } catch (error) {
      console.debug("Skipped SDK received group application list", error);
    }

    try {
      const { applications, currentUserID } = await loadBusinessGroupApplications(
        get().groupList,
      );
      if (currentUserID) {
        hasLoadedSource = true;
      }
      tmpList = mergeGroupApplications(
        tmpList,
        applications.filter((item) => !isSameID(item.userID, currentUserID)),
        currentUserID,
      );
    } catch (error) {
      console.debug("Skipped business received group application list", error);
    }

    if (!hasLoadedSource) {
      return false;
    }

    set(() => ({
      recvGroupApplicationList: tmpList,
      unHandleGroupApplicationCount: tmpList.filter(
        (application) =>
          application.handleResult === ApplicationHandleResult.Unprocessed,
      ).length,
    }));
    return true;
  },
  updateRecvGroupApplication: (application: GroupApplicationItem) => {
    let tmpList = [...get().recvGroupApplicationList];
    let isHandleResultUpdate = false;
    const idx = tmpList.findIndex((a) => isSameID(a.userID, application.userID));
    if (idx < 0) {
      tmpList = [...tmpList, application];
    } else {
      isHandleResultUpdate = true;
      tmpList[idx] = { ...application };
    }
    if (idx < 0 || application.handleResult === ApplicationHandleResult.Unprocessed) {
      const unHandleGroupApplicationCount = tmpList.filter(
        (application) => application.handleResult === 0,
      ).length;
      set(() => ({ recvGroupApplicationList: tmpList, unHandleGroupApplicationCount }));
      return Promise.resolve();
    }
    set(() => ({ recvGroupApplicationList: tmpList }));
    return Promise.resolve();
  },
  getSendGroupApplicationListByReq: async () => {
    let tmpList = [] as GroupApplicationItem[];
    let hasLoadedSource = false;
    try {
      const { data } = await IMSDK.getGroupApplicationListAsApplicant();
      tmpList = [...data];
      hasLoadedSource = true;
    } catch (error) {
      console.debug("Skipped SDK sent group application list", error);
    }

    try {
      const { applications, currentUserID } = await loadBusinessGroupApplications(
        get().groupList,
      );
      if (currentUserID) {
        hasLoadedSource = true;
      }
      tmpList = mergeGroupApplications(
        tmpList,
        applications.filter((item) => isSameID(item.userID, currentUserID)),
        currentUserID,
      );
    } catch (error) {
      console.debug("Skipped business sent group application list", error);
    }

    if (!hasLoadedSource) {
      return false;
    }

    set(() => ({ sendGroupApplicationList: tmpList }));
    return true;
  },
  updateSendGroupApplication: (application: GroupApplicationItem) => {
    let tmpList = [...get().sendGroupApplicationList];
    const idx = tmpList.findIndex((a) => isSameID(a.groupID, application.groupID));
    if (idx < 0) {
      tmpList = [...tmpList, application];
    } else {
      tmpList[idx] = { ...application };
    }
    set(() => ({ sendGroupApplicationList: tmpList }));
  },
  updateUnHandleFriendApplicationCount: (num: number) => {
    set(() => ({ unHandleFriendApplicationCount: num }));
  },
  updateUnHandleGroupApplicationCount: (num: number) => {
    set(() => ({ unHandleGroupApplicationCount: num }));
  },
  clearContactStore: () => {
    contactLoadPromises.friendList = undefined;
    contactLoadPromises.groupList = undefined;
    contactLoadPromises.friendApplications = undefined;
    contactLoadPromises.groupApplications = undefined;
    set(() => ({
      friendList: [],
      blackList: [],
      groupList: [],
      recvFriendApplicationList: [],
      sendFriendApplicationList: [],
      recvGroupApplicationList: [],
      sendGroupApplicationList: [],
      unHandleFriendApplicationCount: 0,
      unHandleGroupApplicationCount: 0,
      contactDataLoaded: {
        friendList: false,
        groupList: false,
        friendApplications: false,
        groupApplications: false,
      },
      contactDataLoading: {
        friendList: false,
        groupList: false,
        friendApplications: false,
        groupApplications: false,
      },
    }));
  },
}));
