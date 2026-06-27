import businessRequest from "./business";

export interface MessageSearchParams {
  keyword?: string;
  contentType?: number;
  fileExt?: string;
  startTime?: number;
  endTime?: number;
  includeDestroyed?: boolean;
  pageIndex?: number;
  pageSize?: number;
}

export interface SingleMessageSearchParams extends MessageSearchParams {
  peerUserId: string;
}

export interface GroupMessageSearchParams extends MessageSearchParams {
  roomId: string;
  senderUserId?: string;
}

export interface SingleSendBeforeParams {
  toUserId: string | number;
}

export interface GroupSendBeforeParams {
  roomId: string;
  messageType?: "file" | string;
  atAll?: 0 | 1 | number;
  contentText?: string;
  fileSize?: number;
}

export interface RecallGroupMessageParams {
  roomId: string;
  clientMsgID?: string;
  serverMsgID?: string;
  seq?: number;
  [key: string]: unknown;
}

export interface MergeMessageParams {
  auditIds: Array<string | number> | string;
  title?: string;
  note?: string;
  tags?: Array<string | number> | string;
  targetType?: "single" | "group" | string;
  targetId?: string | number;
  [key: string]: unknown;
}

export interface FavoriteMessageParams {
  auditId?: string | number;
  roomId?: string | number;
  clientMsgID?: string;
  serverMsgID?: string;
  seq?: number;
  note?: string;
  tags?: Array<string | number> | string;
}

export interface UpdateFavoriteMessageParams {
  favoriteId: string | number;
  title?: string;
  note?: string;
  tags?: Array<string | number> | string;
}

export interface MergeFavoriteMessagesParams {
  auditIds: Array<string | number> | string;
  title?: string;
  note?: string;
  tags?: Array<string | number> | string;
}

const emptyBusinessResponse = () => Promise.resolve({});

const normalizeChatText = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const normalizeChatNumber = (value: unknown) => {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && !value.trim())
  ) {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const normalizeChatParams = (params?: Record<string, unknown>) =>
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

const toCsv = (value: Array<string | number> | string | undefined) => {
  if (Array.isArray(value)) {
    const csv = value.map(normalizeChatText).filter(Boolean).join(",");
    return csv || undefined;
  }

  const text = normalizeChatText(value);
  return text
    ? text
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .join(",")
    : undefined;
};

const normalizeMergeParams = ({
  auditIds,
  tags,
  targetId,
  targetType,
  ...params
}: MergeMessageParams) => ({
  ...params,
  auditIds: toCsv(auditIds),
  tags: toCsv(tags),
  targetType: normalizeChatText(targetType) || undefined,
  targetId: normalizeChatText(targetId) || undefined,
});

const normalizeFavoriteParams = ({
  auditId,
  roomId,
  clientMsgID,
  serverMsgID,
  seq,
  tags,
  ...params
}: FavoriteMessageParams) => ({
  ...params,
  auditId: normalizeChatText(auditId) || undefined,
  roomId: normalizeChatText(roomId) || undefined,
  clientMsgID: normalizeChatText(clientMsgID) || undefined,
  serverMsgID: normalizeChatText(serverMsgID) || undefined,
  seq: normalizeChatNumber(seq),
  tags: toCsv(tags),
});

const normalizeMergeFavoriteParams = ({
  auditIds,
  tags,
  ...params
}: MergeFavoriteMessagesParams) => ({
  ...params,
  auditIds: toCsv(auditIds),
  tags: toCsv(tags),
});

const hasFavoriteLocator = (params: FavoriteMessageParams) =>
  Boolean(
    params.auditId ||
      params.clientMsgID ||
      params.serverMsgID ||
      params.seq !== undefined,
  );

const normalizeRecallParams = ({
  roomId,
  clientMsgID,
  serverMsgID,
  seq,
  ...params
}: RecallGroupMessageParams) => ({
  ...params,
  roomId: normalizeChatText(roomId),
  clientMsgID: normalizeChatText(clientMsgID) || undefined,
  serverMsgID: normalizeChatText(serverMsgID) || undefined,
  seq: normalizeChatNumber(seq),
});

const hasMessageLocator = (params: RecallGroupMessageParams) =>
  Boolean(params.clientMsgID || params.serverMsgID || params.seq !== undefined);

export const singleSendBefore = (params: SingleSendBeforeParams) => {
  const toUserId = normalizeChatText(params.toUserId);
  if (!toUserId) {
    return emptyBusinessResponse();
  }

  return businessRequest.get<unknown>("/friend/openim/send-before", {
    params: {
      ...params,
      toUserId,
    },
  });
};

export const groupSendBefore = (params: GroupSendBeforeParams) => {
  const roomId = normalizeChatText(params.roomId);
  if (!roomId) {
    return emptyBusinessResponse();
  }

  return businessRequest.get<unknown>("/room/openim/send-before", {
    params: {
      ...params,
      roomId,
      messageType: normalizeChatText(params.messageType) || undefined,
    },
  });
};

export const openIMGroupSendBefore = (params: GroupSendBeforeParams) => {
  const roomId = normalizeChatText(params.roomId);
  if (!roomId) {
    return emptyBusinessResponse();
  }

  return businessRequest.get<unknown>("/room/openim/send-before", {
    params: {
      ...params,
      roomId,
      messageType: normalizeChatText(params.messageType) || undefined,
    },
  });
};

export const searchSingleMessages = (params: SingleMessageSearchParams) => {
  const peerUserId = normalizeChatText(params.peerUserId);
  const keyword = normalizeChatText(params.keyword);
  if (!peerUserId || !keyword) {
    return emptyBusinessResponse();
  }

  return businessRequest.get<unknown>("/friend/openim/messages/search", {
    params: {
      pageIndex: 0,
      pageSize: 20,
      ...params,
      peerUserId,
      keyword,
    },
  });
};

export const searchGroupMessages = (params: GroupMessageSearchParams) => {
  const roomId = normalizeChatText(params.roomId);
  const keyword = normalizeChatText(params.keyword);
  if (!roomId || !keyword) {
    return emptyBusinessResponse();
  }

  return businessRequest.get<unknown>("/room/openim/messages/search", {
    params: {
      pageIndex: 0,
      pageSize: 20,
      ...params,
      roomId,
      keyword,
      senderUserId: normalizeChatText(params.senderUserId) || undefined,
    },
  });
};

export const recallGroupMessage = (params: RecallGroupMessageParams) => {
  const normalizedParams = normalizeRecallParams(params);
  if (!normalizedParams.roomId || !hasMessageLocator(normalizedParams)) {
    return emptyBusinessResponse();
  }

  return businessRequest.post<unknown>("/room/openim/message/recall", undefined, {
    params: normalizedParams,
  });
};

export const previewMergeMessage = (params: MergeMessageParams) => {
  const normalizedParams = normalizeMergeParams(params);
  if (!normalizedParams.auditIds) {
    return emptyBusinessResponse();
  }

  return businessRequest.get<unknown>("/message/merge/preview", {
    params: normalizedParams,
  });
};

export const saveMergeMessage = (params: MergeMessageParams) => {
  const normalizedParams = normalizeMergeParams(params);
  if (!normalizedParams.auditIds) {
    return emptyBusinessResponse();
  }

  return businessRequest.post<unknown>("/message/merge/save", undefined, {
    params: normalizedParams,
  });
};

export const forwardMergeMessageBefore = (params: MergeMessageParams) => {
  const normalizedParams = normalizeMergeParams(params);
  if (
    !normalizedParams.auditIds ||
    !normalizedParams.targetType ||
    !normalizedParams.targetId
  ) {
    return emptyBusinessResponse();
  }

  return businessRequest.get<unknown>("/message/merge/forward-before", {
    params: normalizedParams,
  });
};

export const getSavedMergeMessages = (params?: Record<string, unknown>) =>
  businessRequest.get<unknown>("/message/merge/saved", {
    params: {
      pageIndex: 0,
      pageSize: 20,
      ...normalizeChatParams(params),
    },
  });

export const getMergeMessageContext = () =>
  businessRequest.get<unknown>("/message/merge/context");

export const getMergeMessageDetail = (mergeId: string | number) => {
  const normalizedMergeId = normalizeChatText(mergeId);
  if (!normalizedMergeId) {
    return emptyBusinessResponse();
  }

  return businessRequest.get<unknown>("/message/merge/detail", {
    params: {
      mergeId: normalizedMergeId,
    },
  });
};

export const deleteMergeMessage = (mergeId: string | number) => {
  const normalizedMergeId = normalizeChatText(mergeId);
  if (!normalizedMergeId) {
    return emptyBusinessResponse();
  }

  return businessRequest.post<unknown>("/message/merge/delete", undefined, {
    params: {
      mergeId: normalizedMergeId,
    },
  });
};

export const getFavoriteMessages = (params?: Record<string, unknown>) =>
  businessRequest.get<unknown>("/message/favorites", {
    params: {
      pageIndex: 0,
      pageSize: 20,
      ...normalizeChatParams(params),
    },
  });

export const getFavoriteMessageContext = () =>
  businessRequest.get<unknown>("/message/favorites/context");

export const addFavoriteMessage = (params: FavoriteMessageParams | string | number) => {
  const normalizedParams =
    typeof params === "object"
      ? normalizeFavoriteParams(params)
      : {
          auditId: normalizeChatText(params) || undefined,
        };

  if (!hasFavoriteLocator(normalizedParams)) {
    return emptyBusinessResponse();
  }

  return businessRequest.post<unknown>("/message/favorites/add", undefined, {
    params: normalizedParams,
  });
};

export const updateFavoriteMessage = ({
  tags,
  ...params
}: UpdateFavoriteMessageParams) => {
  const favoriteId = normalizeChatText(params.favoriteId);
  if (!favoriteId) {
    return emptyBusinessResponse();
  }

  return businessRequest.post<unknown>("/message/favorites/update", undefined, {
    params: {
      ...params,
      favoriteId,
      tags: toCsv(tags),
    },
  });
};

export const mergeFavoriteMessages = (params: MergeFavoriteMessagesParams) => {
  const normalizedParams = normalizeMergeFavoriteParams(params);
  if (!normalizedParams.auditIds) {
    return emptyBusinessResponse();
  }

  return businessRequest.post<unknown>("/message/favorites/merge", undefined, {
    params: normalizedParams,
  });
};

export const deleteFavoriteMessage = (favoriteId: string | number) => {
  const normalizedFavoriteId = normalizeChatText(favoriteId);
  if (!normalizedFavoriteId) {
    return emptyBusinessResponse();
  }

  return businessRequest.post<unknown>("/message/favorites/delete", undefined, {
    params: {
      favoriteId: normalizedFavoriteId,
    },
  });
};

export const getFavoriteMessageDetail = (favoriteId: string | number) => {
  const normalizedFavoriteId = normalizeChatText(favoriteId);
  if (!normalizedFavoriteId) {
    return emptyBusinessResponse();
  }

  return businessRequest.get<unknown>("/message/favorites/detail", {
    params: {
      favoriteId: normalizedFavoriteId,
    },
  });
};
