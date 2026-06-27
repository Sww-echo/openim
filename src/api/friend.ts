import type { MessageReceiveOptType } from "@openim/wasm-client-sdk";

import { getIMUserID } from "@/utils/storage";

import businessRequest from "./business";

export interface BusinessUserInfo {
  userID: string;
  userId?: string | number;
  password?: string;
  account?: string;
  phoneNumber?: string;
  telephone?: string;
  phoneRemark?: string;
  areaCode?: string;
  email?: string;
  nickname: string;
  faceURL: string;
  gender?: number;
  sex?: number;
  level?: number;
  birth?: number;
  birthday?: number;
  allowAddFriend?: BusinessAllowType;
  allowBeep?: BusinessAllowType;
  allowVibration?: BusinessAllowType;
  globalRecvMsgOpt?: MessageReceiveOptType;
  [key: string]: unknown;
}

export enum BusinessAllowType {
  Allow = 1,
  NotAllow = 2,
}

interface FriendSearchPayload {
  total?: number;
  users?: unknown[];
  list?: unknown[];
  records?: unknown[];
  pageData?: unknown[];
  data?: unknown;
  [key: string]: unknown;
}

interface UpdateBusinessUserInfoParams {
  email: string;
  nickname: string;
  faceURL: string;
  gender: number;
  birth: number;
  allowAddFriend: number;
  allowBeep: number;
  allowVibration: number;
  globalRecvMsgOpt: number;
}

export interface FriendPageParams {
  pageIndex?: number;
  pageSize?: number;
  [key: string]: unknown;
}

export interface FriendPropertyParams {
  chatRecordTimeOut?: string | number;
  [key: string]: unknown;
}

export interface FriendSettingsParams {
  offlineNoPushMsg: 0 | 1 | number;
  type?: number;
  [key: string]: unknown;
}

export interface BusinessOnlineStatus {
  isOnline?: boolean;
  online?: boolean;
  status?: string | number | boolean;
  onlineStatus?: string | number | boolean;
  [key: string]: unknown;
}

const asRecord = (value: unknown) =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const normalizeBusinessText = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const normalizeBusinessParams = (params?: Record<string, unknown>) =>
  Object.entries(params ?? {}).reduce((nextParams, [key, value]) => {
    if (value === undefined || value === null) {
      return nextParams;
    }
    if (typeof value === "string") {
      const text = value.trim();
      if (text) {
        nextParams[key] = text;
      }
      return nextParams;
    }
    if (typeof value === "number") {
      if (Number.isFinite(value)) {
        nextParams[key] = value;
      }
      return nextParams;
    }

    nextParams[key] = value;
    return nextParams;
  }, {} as Record<string, unknown>);

const unwrapData = (response: unknown) => {
  const record = asRecord(response);
  return "data" in record ? record.data : response;
};

const normalizeUserInfo = (
  payload: unknown,
  fallbackUserID?: string,
): BusinessUserInfo => {
  const record = asRecord(payload);
  const nested =
    record.user ??
    record.userInfo ??
    record.friend ??
    record.member ??
    record.data ??
    payload;
  const info = asRecord(Array.isArray(nested) ? nested[0] : nested);
  const userID = normalizeBusinessText(
    info.userID ?? info.userId ?? info.id ?? fallbackUserID,
  );

  return {
    ...info,
    userID,
    account: normalizeBusinessText(
      info.account ?? info.communicationNo ?? info.userAccount ?? info.setAccount,
    ),
    nickname: normalizeBusinessText(info.nickname ?? info.nickName ?? info.name),
    faceURL: normalizeBusinessText(
      info.faceURL ?? info.faceUrl ?? info.avatar ?? info.avatarUrl ?? info.headimgurl,
    ),
    phoneNumber: normalizeBusinessText(
      info.phoneNumber ??
        info.telephone ??
        info.phone ??
        info.mobile ??
        info.mobilePhone ??
        info.tel,
    ),
    telephone: normalizeBusinessText(
      info.telephone ??
        info.phoneNumber ??
        info.phone ??
        info.mobile ??
        info.mobilePhone ??
        info.tel,
    ),
    gender: Number(info.gender ?? info.sex ?? 0),
    birth: Number(info.birth ?? info.birthday ?? 0),
  };
};

const normalizeUserList = (payload: unknown) => {
  const data = unwrapData(payload);
  const record = asRecord(data) as FriendSearchPayload;
  const rawList =
    record.users ??
    record.list ??
    record.records ??
    record.pageData ??
    (Array.isArray(record.data) ? record.data : undefined) ??
    (Array.isArray(data) ? data : []);
  const users = rawList.map((item) => normalizeUserInfo(item));
  const total = Number(record.total ?? record.count ?? users.length);

  return { total, users };
};

const hasUserID = (user: BusinessUserInfo) => Boolean(user.userID);

const isSameBusinessID = (
  left?: string | number | null,
  right?: string | number | null,
) => {
  const normalizedLeft = normalizeBusinessText(left);
  const normalizedRight = normalizeBusinessText(right);

  return Boolean(normalizedLeft) && normalizedLeft === normalizedRight;
};

const PHONE_NUMBER_PATTERN = /^1\d{10}$/;

const buildAccountLookupCandidates = (keyword: string) => {
  const normalizedKeyword = normalizeBusinessText(keyword);
  if (!normalizedKeyword) {
    return [];
  }

  const candidates = new Set<string>([normalizedKeyword]);

  if (PHONE_NUMBER_PATTERN.test(normalizedKeyword)) {
    candidates.add(`+86${normalizedKeyword}`);
    candidates.add(`86${normalizedKeyword}`);
  }

  if (normalizedKeyword.startsWith("+86") && normalizedKeyword.length > 3) {
    const withoutCountryCode = normalizedKeyword.slice(3);
    if (PHONE_NUMBER_PATTERN.test(withoutCountryCode)) {
      candidates.add(withoutCountryCode);
    }
  }

  if (
    normalizedKeyword.startsWith("86") &&
    normalizedKeyword.length > 2 &&
    PHONE_NUMBER_PATTERN.test(normalizedKeyword.slice(2))
  ) {
    candidates.add(normalizedKeyword.slice(2));
  }

  return [...candidates];
};

const isKeywordMatchedUser = (user: BusinessUserInfo, keyword: string) =>
  [user.userID, user.phoneNumber, user.telephone, user.account].some((value) =>
    isSameBusinessID(value, keyword),
  );

const lookupBusinessUserByAccountCandidates = async (keyword: string) => {
  for (const account of buildAccountLookupCandidates(keyword)) {
    try {
      const accountUser = await getBusinessUserByAccount(account);
      if (!accountUser.userID) {
        continue;
      }
      if (isKeywordMatchedUser(accountUser, keyword)) {
        return accountUser;
      }
    } catch (error) {
      console.warn("get business user by account failed", account, error);
    }
  }

  return undefined;
};

const getCurrentUserID = async () => normalizeBusinessText(await getIMUserID());

const getCurrentUserIDWithTimeout = async () =>
  Promise.race([
    getCurrentUserID(),
    new Promise<string>((resolve) => setTimeout(() => resolve(""), 3000)),
  ]);

const toUserIdParam = (toUserId: string | number | Array<string | number>) =>
  Array.isArray(toUserId)
    ? toUserId.map(normalizeBusinessText).filter(Boolean).join(",")
    : normalizeBusinessText(toUserId);

const normalizeUserUpdateParams = ({
  faceURL,
  gender,
  birth,
  allowAddFriend,
  allowBeep,
  allowVibration,
  globalRecvMsgOpt,
  ...params
}: Partial<UpdateBusinessUserInfoParams>) => ({
  ...params,
  headimgurl: faceURL,
  sex: gender,
  birthday: birth,
  friendsVerify: allowAddFriend,
  isTyping: allowBeep,
  isVibration: allowVibration,
  chatSyncTimeLen: globalRecvMsgOpt,
});

const pickUserAvatarUrl = (info: Record<string, unknown>) =>
  String(
    info.faceURL ??
      info.faceUrl ??
      info.avatar ??
      info.avatarUrl ??
      info.avatarURL ??
      info.headimgurl ??
      info.headImgUrl ??
      info.url ??
      "",
  );

const normalizeAvatarResponse = (payload: unknown) => {
  const unwrapped = unwrapData(payload);
  const record = asRecord(unwrapped);
  const avatarUrl = pickUserAvatarUrl(record);

  if (avatarUrl) {
    return avatarUrl;
  }

  return typeof unwrapped === "string" || typeof unwrapped === "number"
    ? String(unwrapped)
    : "";
};

const failedAvatarUserIds = new Set<string>();

export const getBusinessUserAvatar = async (
  userId: string | number,
  update: 0 | 1 | number = 0,
) => {
  const normalizedUserId = normalizeBusinessText(userId);
  if (!normalizedUserId) {
    return "";
  }

  const response = await businessRequest.post<unknown>("/user/avatar/get", undefined, {
    params: {
      userId: normalizedUserId,
      update,
    },
  });

  return normalizeAvatarResponse(response);
};

const withBusinessAvatarFallback = async (user: BusinessUserInfo) => {
  if (user.faceURL || !user.userID) {
    return user;
  }
  if (failedAvatarUserIds.has(user.userID)) {
    return user;
  }

  try {
    const avatarUrl = await getBusinessUserAvatar(user.userID);

    return avatarUrl
      ? {
          ...user,
          faceURL: avatarUrl,
        }
      : user;
  } catch (error) {
    failedAvatarUserIds.add(user.userID);
    return user;
  }
};

export const getBusinessUserInfo = async (
  userIDs: string[],
): Promise<{ data: { users: BusinessUserInfo[] } }> => {
  const normalizedUserIDs = userIDs.map(normalizeBusinessText).filter(Boolean);
  if (!normalizedUserIDs.length) {
    return {
      data: {
        users: [],
      },
    };
  }

  const users = await Promise.all(
    normalizedUserIDs.map(async (userID) => {
      const response = await businessRequest.post<BusinessUserInfo>(
        "/user/get",
        undefined,
        {
          params: {
            userId: userID,
          },
        },
      );
      return withBusinessAvatarFallback(
        normalizeUserInfo(unwrapData(response), userID),
      );
    }),
  );

  return {
    data: {
      users,
    },
  };
};

export const getBusinessUserBySearchKey = async (keyword: string) => {
  const normalizedKeyword = normalizeBusinessText(keyword);
  if (!normalizedKeyword) {
    return normalizeUserInfo({});
  }

  const response = await businessRequest.get<BusinessUserInfo>("/user/get", {
    params: {
      userId: normalizedKeyword,
    },
    timeout: 6000,
  });

  return withBusinessAvatarFallback(
    normalizeUserInfo(unwrapData(response), normalizedKeyword),
  );
};

export const getBusinessUserInfoV1 = async (
  userId: string | number,
  roomId?: string | number,
) => {
  const normalizedUserId = normalizeBusinessText(userId);
  const normalizedRoomId = normalizeBusinessText(roomId);
  if (!normalizedUserId && !normalizedRoomId) {
    return {};
  }

  return businessRequest.post<BusinessUserInfo>("/user/get/v1", undefined, {
    params: {
      ...(normalizedUserId ? { userId: normalizedUserId } : {}),
      ...(normalizedRoomId ? { roomId: normalizedRoomId } : {}),
    },
  });
};

export const getCurrentBusinessUserInfo = () =>
  businessRequest.post<BusinessUserInfo>("/user/getUserInfo");

export const getBusinessUserBindInfo = () =>
  businessRequest.post<BusinessUserInfo>("/user/getBindInfo");

export const getFriendInfo = async (toUserId: string) => {
  const userId = await getCurrentUserID();
  const normalizedToUserId = normalizeBusinessText(toUserId);
  if (!normalizedToUserId) {
    return {};
  }

  return businessRequest.post<BusinessUserInfo>("/friends/get", undefined, {
    params: {
      userId,
      toUserId: normalizedToUserId,
    },
  });
};

export const getFriendList = async (keyword?: string) => {
  const userId = await getCurrentUserID();
  const normalizedKeyword = normalizeBusinessText(keyword);
  if (!userId) {
    return {
      data: {
        users: [],
        total: 0,
      },
    };
  }

  return businessRequest.post<FriendSearchPayload>("/friends/list", undefined, {
    params: {
      userId,
      ...(normalizedKeyword ? { keyword: normalizedKeyword } : {}),
    },
  });
};

export const searchBusinessUserInfo = async (
  keyword: string,
): Promise<{ data: { total: number; users: BusinessUserInfo[] } }> => {
  const normalizedKeyword = normalizeBusinessText(keyword);
  if (!normalizedKeyword) {
    return {
      data: {
        total: 0,
        users: [],
      },
    };
  }

  const accountUser = await lookupBusinessUserByAccountCandidates(normalizedKeyword);
  if (accountUser?.userID) {
    return {
      data: {
        total: 1,
        users: [accountUser],
      },
    };
  }

  try {
    const publicUsers = await searchPublicBusinessUsers(normalizedKeyword);
    const matchedUsers = publicUsers.users.filter((user) =>
      isKeywordMatchedUser(user, normalizedKeyword),
    );
    if (matchedUsers.length) {
      return {
        data: {
          total: matchedUsers.length,
          users: matchedUsers,
        },
      };
    }
  } catch (error) {
    console.warn("search public business users failed", normalizedKeyword, error);
  }

  try {
    const keywordUser = await getBusinessUserBySearchKey(normalizedKeyword);
    if (keywordUser.userID && isKeywordMatchedUser(keywordUser, normalizedKeyword)) {
      return {
        data: {
          total: 1,
          users: [keywordUser],
        },
      };
    }
  } catch (error) {
    console.warn("get business user by search key failed", normalizedKeyword, error);
  }

  const userId = await getCurrentUserIDWithTimeout();
  if (!userId) {
    return {
      data: {
        total: 0,
        users: [],
      },
    };
  }

  const response = await businessRequest.get<FriendSearchPayload>("/friends/page", {
    params: {
      userId,
      keyword: normalizedKeyword,
      pageIndex: 0,
      pageSize: 10,
      status: 0,
    },
    timeout: 6000,
  });
  const normalized = normalizeUserList(response);
  const matchedUsers = normalized.users.filter((user) =>
    isKeywordMatchedUser(user, normalizedKeyword),
  );

  return {
    data: matchedUsers.length
      ? {
          total: matchedUsers.length,
          users: matchedUsers,
        }
      : normalized,
  };
};

export const searchPublicBusinessUsers = async (keyword: string) => {
  const normalizedKeyword = normalizeBusinessText(keyword);
  if (!normalizedKeyword) {
    return {
      total: 0,
      users: [],
    };
  }

  const response = await businessRequest.get<FriendSearchPayload>(
    "/user/public/search/list",
    {
      params: {
        keyWorld: normalizedKeyword,
        page: 0,
        limit: 10,
      },
      timeout: 6000,
    },
  );
  const normalized = normalizeUserList(response);

  return {
    total: normalized.total,
    users: normalized.users.filter(hasUserID),
  };
};

export const getBusinessUserByAccount = async (account: string) => {
  const normalizedAccount = normalizeBusinessText(account);
  if (!normalizedAccount) {
    return normalizeUserInfo({});
  }

  const response = await businessRequest.get<BusinessUserInfo>("/user/getByAccount", {
    params: {
      account: normalizedAccount,
    },
    timeout: 6000,
  });

  return withBusinessAvatarFallback(normalizeUserInfo(unwrapData(response)));
};

export const getBusinessUserOnlineStatus = async (userId?: string | number | null) => {
  const normalizedUserId =
    normalizeBusinessText(userId) || (await getCurrentUserIDWithTimeout());

  if (!normalizedUserId) {
    return {};
  }

  const response = await businessRequest.post<BusinessOnlineStatus>(
    "/user/getOnLine",
    undefined,
    {
      params: {
        userId: normalizedUserId,
      },
      timeout: 6000,
    },
  );

  return unwrapData(response) as BusinessOnlineStatus;
};

export const updateBusinessUserInfo = async (
  params: Partial<UpdateBusinessUserInfoParams>,
) => {
  const userId = await getCurrentUserID();
  if (!userId) {
    return {};
  }

  return businessRequest.post<unknown>("/user/update", undefined, {
    params: {
      ...normalizeUserUpdateParams(params),
      userId,
    },
  });
};

export const updateFriendRemark = async (
  toUserId: string,
  remark: string,
  describe = "",
) => {
  const normalizedToUserId = normalizeBusinessText(toUserId);
  if (!normalizedToUserId) {
    return {};
  }

  return businessRequest.post<unknown>("/friends/remark", undefined, {
    params: {
      toUserId: normalizedToUserId,
      remarkName: remark,
      describe,
    },
  });
};

export const updateFriendPhoneRemark = async (
  toUserId: string | number,
  phoneRemark: string,
) => {
  const normalizedToUserId = normalizeBusinessText(toUserId);
  if (!normalizedToUserId) {
    return {};
  }

  return businessRequest.post<unknown>("/friends/modify/phoneRemark", undefined, {
    params: {
      toUserId: normalizedToUserId,
      phoneRemark,
    },
  });
};

export const updateFriendSettings = async (
  toUserId: string,
  params: FriendSettingsParams,
) => {
  const userId = await getCurrentUserID();
  const normalizedToUserId = normalizeBusinessText(toUserId);
  if (!userId || !normalizedToUserId) {
    return {};
  }

  return businessRequest.post<unknown>("/friends/update/OfflineNoPushMsg", undefined, {
    params: {
      ...params,
      userId,
      toUserId: normalizedToUserId,
    },
  });
};

export const updateFriendProperties = async (
  toUserId: string | number,
  params: FriendPropertyParams,
) => {
  const normalizedToUserId = normalizeBusinessText(toUserId);
  if (!normalizedToUserId) {
    return {};
  }

  return businessRequest.post<unknown>("/friends/update", undefined, {
    params: {
      ...params,
      toUserId: normalizedToUserId,
    },
  });
};

export const addBusinessFriend = (toUserId: string | number, reqMsg?: string) => {
  const normalizedToUserId = normalizeBusinessText(toUserId);
  if (!normalizedToUserId) {
    return Promise.resolve({});
  }
  const normalizedReqMsg = normalizeBusinessText(reqMsg);

  return businessRequest.post<unknown>("/friends/add", undefined, {
    params: {
      toUserId: normalizedToUserId,
      ...(normalizedReqMsg ? { reqMsg: normalizedReqMsg } : {}),
    },
  });
};

export const deleteBusinessFriend = (toUserId: string | number) => {
  const normalizedToUserId = normalizeBusinessText(toUserId);
  if (!normalizedToUserId) {
    return Promise.resolve({});
  }

  return businessRequest.post<unknown>("/friends/delete", undefined, {
    params: {
      toUserId: normalizedToUserId,
    },
  });
};

export const getBusinessBlacklist = (params: FriendPageParams = {}) =>
  businessRequest.post<unknown>("/friends/queryBlacklistWeb", undefined, {
    params: {
      pageIndex: 0,
      pageSize: 20,
      ...normalizeBusinessParams(params),
    },
  });

export const getLegacyBusinessBlacklist = (params: FriendPageParams = {}) =>
  businessRequest.post<unknown>("/friends/blacklist", undefined, {
    params: {
      pageIndex: 0,
      pageSize: 20,
      ...normalizeBusinessParams(params),
    },
  });

export const addBusinessBlacklist = (
  toUserId: string | number | Array<string | number>,
) => {
  const normalizedToUserId = toUserIdParam(toUserId);
  if (!normalizedToUserId) {
    return Promise.resolve({});
  }

  return businessRequest.post<unknown>("/friends/blacklist/add", undefined, {
    params: {
      toUserId: normalizedToUserId,
    },
  });
};

export const deleteBusinessBlacklist = (toUserId: string | number) => {
  const normalizedToUserId = normalizeBusinessText(toUserId);
  if (!normalizedToUserId) {
    return Promise.resolve({});
  }

  return businessRequest.post<unknown>("/friends/blacklist/delete", undefined, {
    params: {
      toUserId: normalizedToUserId,
    },
  });
};

export const getNewFriendList = async (params: FriendPageParams = {}) => {
  const userId = await getCurrentUserID();
  if (!userId) {
    return {
      data: {
        list: [],
      },
    };
  }

  return businessRequest.post<unknown>("/friends/newFriendListWeb", undefined, {
    params: {
      userId,
      pageIndex: 0,
      pageSize: 20,
      ...normalizeBusinessParams(params),
    },
  });
};

export const getLegacyNewFriendList = async (params: FriendPageParams = {}) => {
  const userId = await getCurrentUserID();
  if (!userId) {
    return {
      data: {
        list: [],
      },
    };
  }

  return businessRequest.post<unknown>("/friends/newFriend/list", undefined, {
    params: {
      userId,
      pageIndex: 0,
      pageSize: 20,
      ...normalizeBusinessParams(params),
    },
  });
};

export const getLatestNewFriendRecord = (toUserId: string | number) => {
  const normalizedToUserId = normalizeBusinessText(toUserId);
  if (!normalizedToUserId) {
    return Promise.resolve({});
  }

  return businessRequest.post<unknown>("/friends/newFriend/last", undefined, {
    params: {
      toUserId: normalizedToUserId,
    },
  });
};
