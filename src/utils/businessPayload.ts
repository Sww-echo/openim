export type BusinessRecord = Record<string, unknown>;

export const isBusinessRecord = (value: unknown): value is BusinessRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const unwrapBusinessPayload = (value: unknown): unknown => {
  let current = value;
  const seen = new Set<unknown>();

  while (isBusinessRecord(current) && !seen.has(current)) {
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

export const getBusinessListPayload = (value: unknown): BusinessRecord[] => {
  const payload = unwrapBusinessPayload(value);

  if (Array.isArray(payload)) {
    return payload.filter(isBusinessRecord);
  }
  if (!isBusinessRecord(payload)) {
    return [];
  }

  const listKey = [
    "list",
    "records",
    "rows",
    "items",
    "users",
    "friends",
    "pageData",
    "dataList",
    "resultList",
    "helpers",
    "availableHelpers",
    "groupHelpers",
    "groupHelperList",
    "members",
    "onlineMembers",
    "specialMembers",
    "groups",
    "groupList",
    "rooms",
    "roomList",
    "groupInfos",
    "roomInfos",
    "notices",
    "joinRequests",
    "announcements",
    "shares",
    "resources",
    "favorites",
    "messages",
    "mergeMessages",
  ].find((key) => Array.isArray(payload[key]));

  return listKey ? (payload[listKey] as unknown[]).filter(isBusinessRecord) : [];
};

export const toBusinessText = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

export const pickBusinessText = (record: BusinessRecord, keys: string[]) =>
  keys.map((key) => toBusinessText(record[key])).find(Boolean) ?? "";

const roomIdKeys = [
  "roomId",
  "roomID",
  "roomid",
  "room_id",
  "businessRoomId",
  "businessRoomID",
  "oldRoomId",
  "oldRoomID",
  "jid",
  "roomJid",
  "roomJID",
  "room_jid",
];

const groupIdKeys = ["groupID", "groupId", "groupid", "group_id"];

const toBusinessIdText = (value: unknown) => toBusinessText(value).trim();

const pickBusinessIdText = (record: BusinessRecord, keys: string[]) =>
  keys.map((key) => toBusinessIdText(record[key])).find(Boolean) ?? "";

export const pickBusinessRoomId = (
  record: BusinessRecord | undefined,
  fallback?: string | number,
) => {
  const fallbackText = toBusinessIdText(fallback);

  if (!record) {
    return fallbackText;
  }

  const explicitRoomId = pickBusinessIdText(record, roomIdKeys);
  if (explicitRoomId) {
    return explicitRoomId;
  }

  const groupLikeId = pickBusinessIdText(record, groupIdKeys);
  if (groupLikeId && groupLikeId !== fallbackText) {
    return groupLikeId;
  }

  return pickBusinessIdText(record, ["id"]) || groupLikeId || fallbackText;
};

const parseBusinessJsonRecord = (value: unknown) => {
  const text = toBusinessText(value);
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

const getNestedBusinessRecords = (record: BusinessRecord) =>
  [
    record.room,
    record.group,
    record.groupInfo,
    record.roomInfo,
    record.detail,
    record.openIMGroup,
    record.openimGroup,
    record.openImGroup,
    record.openIM,
    record.openim,
    record.businessRoom,
    record.roomMapping,
    record.mapping,
    record.openIMMapping,
    record.openimMapping,
    parseBusinessJsonRecord(record.ex),
  ].filter(isBusinessRecord);

export const pickExplicitBusinessRoomId = (
  record: BusinessRecord | undefined,
  fallback?: string | number,
) => {
  const pickRoomId = (
    currentRecord: BusinessRecord | undefined,
    fallbackText: string,
    seen: Set<BusinessRecord>,
  ): string => {
    if (!currentRecord || seen.has(currentRecord)) {
      return "";
    }
    seen.add(currentRecord);

    const explicitRoomId = pickBusinessIdText(currentRecord, roomIdKeys);
    if (explicitRoomId) {
      return explicitRoomId;
    }

    const groupLikeId = pickBusinessIdText(currentRecord, groupIdKeys);
    if (groupLikeId && groupLikeId !== fallbackText) {
      return groupLikeId;
    }

    const id = pickBusinessIdText(currentRecord, ["id"]);
    if (id) {
      return id;
    }

    return (
      getNestedBusinessRecords(currentRecord)
        .map((nestedRecord) => pickRoomId(nestedRecord, fallbackText, seen))
        .find(Boolean) ?? ""
    );
  };

  if (!record) {
    return "";
  }

  const fallbackText = toBusinessIdText(fallback);
  return pickRoomId(record, fallbackText, new Set());
};

export const pickBusinessId = (record: BusinessRecord, keys: string[]) => {
  const value = keys
    .map((key) => record[key])
    .find((item) => typeof item === "string" || typeof item === "number");

  if (typeof value === "string") {
    const text = value.trim();
    return text || undefined;
  }

  return value as number | undefined;
};

const auditIdKeys = ["auditId", "auditID", "messageAuditId", "msgAuditId", "id"];

export const pickBusinessAuditId = (value: unknown) => {
  if (!isBusinessRecord(value)) {
    return undefined;
  }

  const directAuditId = pickBusinessId(value, auditIdKeys);
  if (directAuditId) {
    return directAuditId;
  }

  const ex = toBusinessText(value.ex);
  if (!ex) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(ex);
    if (!isBusinessRecord(parsed)) {
      return undefined;
    }

    return [
      parsed,
      parsed.audit,
      parsed.messageAudit,
      parsed.businessAudit,
      parsed.openimAudit,
      parsed.openimBusinessMessage,
    ]
      .filter(isBusinessRecord)
      .map((record) => pickBusinessId(record, auditIdKeys))
      .find(Boolean);
  } catch {
    return undefined;
  }
};

const joinRequestIdKeys = [
  "requestId",
  "requestID",
  "joinRequestId",
  "joinRequestID",
  "applyId",
  "applyID",
  "applicationId",
  "applicationID",
  "joinApplyId",
  "joinApplyID",
  "roomApplyId",
  "roomApplyID",
  "id",
];

export const pickBusinessJoinRequestId = (
  value: unknown,
  seen = new Set<BusinessRecord>(),
): string | number | undefined => {
  if (!isBusinessRecord(value) || seen.has(value)) {
    return undefined;
  }
  seen.add(value);

  const directRequestId = pickBusinessId(value, joinRequestIdKeys);
  if (directRequestId !== undefined && directRequestId !== "") {
    return directRequestId;
  }

  return [
    value.data,
    value.result,
    value.obj,
    value.request,
    value.joinRequest,
    value.application,
    value.payload,
    value.detail,
    parseBusinessJsonRecord(value.ex),
  ]
    .map((record) => pickBusinessJoinRequestId(record, seen))
    .find((requestId) => requestId !== undefined && requestId !== "");
};

export const pickBusinessNumber = (record: BusinessRecord, keys: string[]) => {
  const picked = keys
    .map((key) => record[key])
    .find((item) => typeof item === "number" || typeof item === "string");
  const numberValue = Number(picked);

  return Number.isFinite(numberValue) ? numberValue : undefined;
};

export const mergeBusinessRecordsByKey = (
  primary: BusinessRecord[],
  fallback: BusinessRecord[],
  pickKey: (record: BusinessRecord) => string | number | undefined,
) => {
  const recordMap = new Map<string, BusinessRecord>();

  [...primary, ...fallback].forEach((record) => {
    const key = pickKey(record);
    const mapKey = key === undefined ? JSON.stringify(record) : String(key);
    recordMap.set(mapKey, {
      ...(recordMap.get(mapKey) ?? {}),
      ...record,
    });
  });

  return [...recordMap.values()];
};

export const settleAtLeastOneBusinessRequest = async (
  requests: Array<Promise<unknown>>,
) => {
  const results = await Promise.allSettled(requests);
  const success = results.some((result) => result.status === "fulfilled");

  if (!success) {
    throw (results.find((result) => result.status === "rejected") as PromiseRejectedResult)
      ?.reason;
  }
};
