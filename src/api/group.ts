import type { GroupItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { t } from "i18next";

import {
  isBusinessRecord,
  pickBusinessNumber,
  pickBusinessText,
  unwrapBusinessPayload,
} from "@/utils/businessPayload";

import businessRequest from "./business";

export interface GroupQueryParams {
  roomId: string | number;
  [key: string]: unknown;
}

export interface GroupJidParams {
  jid: string | number;
  [key: string]: unknown;
}

export interface GroupQRCodeCreateParams extends GroupQueryParams {
  expireHours?: number;
}

export interface GroupQRCodeJoinParams {
  code: string;
  applyReason?: string;
}

export interface JoinBusinessGroupParams extends GroupQueryParams {
  type?: string | number;
}

export interface GroupMemberDeleteParams extends GroupQueryParams {
  userId: string | number;
}

export interface TransferBusinessGroupParams extends GroupQueryParams {
  toUserId: string | number;
}

export interface SetBusinessGroupAdminParams extends GroupQueryParams {
  touserId: string | number;
  type: 2 | 3;
}

export interface AddBusinessGroupMembersParams extends GroupQueryParams {
  text: string;
  keys?: string;
}

export interface CreateBusinessGroupParams {
  room: Record<string, unknown> | string;
  text: Array<string | number> | string;
  keys?: string;
}

export interface GroupMemberListParams extends GroupQueryParams {
  keyword?: string;
  pageIndex?: number;
  pageSize?: number;
  joinTime?: number;
}

export interface LegacyRoomListParams {
  pageIndex?: number;
  pageSize?: number;
  roomName?: string;
  type?: string | number;
}

export interface JoinRequestParams extends GroupQueryParams {
  pageIndex?: number;
  pageSize?: number;
  status?: number;
  [key: string]: unknown;
}

type JoinRequestAction = "approve" | "reject";

type HandleJoinRequestBaseParams = {
  requestId: string | number;
  remark?: string;
  [key: string]: unknown;
};

export type HandleJoinRequestParams = HandleJoinRequestBaseParams &
  (
    | {
        action: JoinRequestAction;
        agree?: boolean;
      }
    | {
        agree: boolean;
        action?: JoinRequestAction;
      }
  );

export interface SpecialRoleParams extends GroupQueryParams {
  userId: string | number;
  role: 3 | 4 | 5;
}

export interface LegacyInvisibleGuardianParams extends GroupQueryParams {
  touserId: string | number;
  type: -1 | 0 | 4 | 5 | number;
}

export interface MemberTargetParams extends GroupQueryParams {
  targetUserId: string | number;
}

export interface MemberRemarkParams extends MemberTargetParams {
  remarkName?: string;
}

export interface MemberMuteParams extends MemberTargetParams {
  durationSeconds: number;
}

export interface MessageReadDetailParams extends GroupQueryParams {
  clientMsgID?: string;
  serverMsgID?: string;
  seq?: number;
}

export interface GroupOfflineNoPushParams extends GroupQueryParams {
  offlineNoPushMsg: 0 | 1 | number;
}

export interface GroupTopParams extends GroupQueryParams {
  top: 0 | 1 | number;
}

export interface LegacyGroupMemberSettingParams extends GroupQueryParams {
  offlineNoPushMsg: 0 | 1 | number;
  type: 0 | 1 | number;
  userId?: string | number;
}

export interface GroupNoticeParams extends GroupQueryParams {
  noticeId: string | number;
  [key: string]: unknown;
}

export type AddGroupNoticeParams = GroupQueryParams &
  (
    | {
        content: string;
        noticeContent?: string;
      }
    | {
        content?: string;
        noticeContent: string;
      }
  );

export interface LegacyGroupNoticeListParams extends GroupQueryParams {
  keyword?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface GroupShareListParams extends GroupQueryParams {
  pageIndex?: number;
  pageSize?: number;
  time?: string | number;
  userId?: string | number;
}

export interface AddGroupShareParams extends GroupQueryParams {
  type: string | number;
  size: string | number;
  url: string;
  name: string;
  fileId?: string | number;
  userId?: string | number;
}

export interface DeleteGroupShareParams extends GroupQueryParams {
  shareId: string | number;
}

export interface GroupHelperListParams extends GroupQueryParams {
  helperId?: string | number;
}

export interface AvailableGroupHelperListParams extends GroupQueryParams {
  openAppId?: string | number;
  pageIndex?: number;
  pageSize?: number;
}

export interface AddGroupHelperParams extends GroupQueryParams {
  helperId: string | number;
  roomJid?: string | number;
}

export interface DeleteGroupHelperParams extends GroupQueryParams {
  groupHelperId: string | number;
}

export interface GroupHelperKeywordParams extends DeleteGroupHelperParams {
  keyword: string;
  value: string;
  helperId?: string | number;
  roomJid?: string | number;
}

export interface UpdateGroupHelperKeywordParams extends GroupHelperKeywordParams {
  keyWordId: string | number;
}

export interface DeleteGroupHelperKeywordParams extends DeleteGroupHelperParams {
  keyWordId: string | number;
}

export type UpdateGroupNoticeParams = GroupNoticeParams &
  (
    | {
        content: string;
        noticeContent?: string;
      }
    | {
        content?: string;
        noticeContent: string;
      }
  );

export interface RoomSettingsParams extends GroupQueryParams {
  roomName?: string;
  notice?: string;
  desc?: string;
  subject?: string;
  showRead?: 0 | 1 | number;
  isNeedVerify?: 0 | 1 | number;
  isLook?: 0 | 1 | number;
  showMember?: 0 | 1 | number;
  allowEditNickname?: 0 | 1 | number;
  allowShareQR?: 0 | 1 | number;
  showOnlineStatus?: 0 | 1 | number;
  allowSendCard?: 0 | 1 | number;
  allowHostUpdate?: 0 | 1 | number;
  chatRecordTimeOut?: string | number;
  allowInviteFriend?: 0 | 1 | number;
  allowUploadFile?: 0 | 1 | number;
  allowConference?: 0 | 1 | number;
  allowMemberPrivateChat?: 0 | 1 | number;
  allowAddFriend?: 0 | 1 | number;
  allowAtAll?: 0 | 1 | number;
  allowCreateNotice?: 0 | 1 | number;
  allowSpeakCourse?: 0 | 1 | number;
  allowQuitRoom?: 0 | 1 | number;
  messageDestroyEnabled?: 0 | 1 | number;
  messageDestroyDays?: number;
  messageDestroyNoticeEnabled?: 0 | 1 | number;
  burnAfterReadEnabled?: 0 | 1 | number;
  burnAfterReadSeconds?: number;
  burnAfterReadNoticeEnabled?: 0 | 1 | number;
  withdrawTime?: number;
  limitSendSmg?: number;
  joinMethod?: 0 | 1 | 2 | number;
  searchable?: 0 | 1 | number;
  messageDestroyContentTypes?: string;
}

const emptyGroupResponse = () => Promise.resolve({});

const normalizeGroupText = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const rejectUnsupportedLatestApiDoc = () =>
  Promise.reject(new Error(t("toast.unsupportedByLatestApiDoc")));

const normalizeGroupNumber = (value: unknown) => {
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

const normalizeGroupParams = (params?: object | null): Record<string, unknown> =>
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

const normalizeRequiredGroupParams = (params: object, requiredKeys: string[]) => {
  const normalizedParams = normalizeGroupParams(params);
  const hasRequiredParams = requiredKeys.every((key) =>
    Boolean(normalizeGroupText(normalizedParams[key])),
  );

  return hasRequiredParams ? normalizedParams : undefined;
};

const normalizeRoomParams = (params: GroupQueryParams) =>
  normalizeRequiredGroupParams(params, ["roomId"]);

const hasMessageLocator = (params: Record<string, unknown>) =>
  Boolean(
    normalizeGroupText(params.clientMsgID) ||
      normalizeGroupText(params.serverMsgID) ||
      params.seq !== undefined,
  );

const normalizeNoticeParams = ({
  content,
  noticeContent,
  ...params
}: AddGroupNoticeParams | UpdateGroupNoticeParams): Record<string, unknown> => {
  const normalizedParams = normalizeGroupParams(params);
  const normalizedNoticeContent = normalizeGroupText(noticeContent ?? content);

  return {
    ...normalizedParams,
    noticeContent: normalizedNoticeContent || undefined,
  };
};

const normalizeJoinHandleParams = ({
  agree,
  action,
  ...params
}: HandleJoinRequestParams): Record<string, unknown> => {
  const normalizedParams = normalizeGroupParams(params);

  return {
    ...normalizedParams,
    action: normalizeGroupText(action ?? (agree ? "approve" : "reject")),
  };
};

const getGroupRecord = (payload: unknown) => {
  const record = isBusinessRecord(payload) ? payload : {};
  const nested = [
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
  ].find(isBusinessRecord);

  return {
    ...record,
    ...(nested ?? {}),
  };
};

const normalizeBusinessGroup = (
  payload: unknown,
  fallbackGroupID: string | number,
): GroupItem | undefined => {
  const group = getGroupRecord(unwrapBusinessPayload(payload));
  const directGroupID = pickBusinessText(group, [
    "groupID",
    "groupId",
    "roomId",
    "roomID",
    "id",
    "jid",
    "roomJid",
    "openIMGroupID",
  ]);

  if (!directGroupID && Object.keys(group).length === 0) {
    return undefined;
  }

  const groupID = directGroupID || String(fallbackGroupID);

  return {
    ...group,
    groupID,
    groupName: pickBusinessText(group, ["groupName", "roomName", "name", "subject"]),
    faceURL: pickBusinessText(group, [
      "faceURL",
      "faceUrl",
      "avatar",
      "avatarUrl",
      "icon",
    ]),
    memberCount: pickBusinessNumber(group, [
      "memberCount",
      "memberNum",
      "userSize",
      "membersCount",
    ]),
    createTime: pickBusinessNumber(group, ["createTime", "createdAt"]),
  } as GroupItem;
};

export const getOpenIMGroupDetail = (params: GroupQueryParams) => {
  const normalizedParams = normalizeRoomParams(params);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.get<unknown>("/room/openim/detail", {
    params: normalizedParams,
  });
};

export const getBusinessRoomInfo = (params: GroupQueryParams) => {
  return getOpenIMGroupDetail(params);
};

export const getLegacyRoomInfoByJid = (roomJid: string | number) => {
  const normalizedRoomJid = normalizeGroupText(roomJid);
  if (!normalizedRoomJid) {
    return emptyGroupResponse();
  }

  return getOpenIMGroupDetail({ roomId: normalizedRoomJid });
};

export const getLegacyRoomInfo = (params: GroupMemberListParams) => {
  return getOpenIMGroupDetail(params);
};

export const getLegacyRoomList = (_params: LegacyRoomListParams = {}) =>
  rejectUnsupportedLatestApiDoc();

export const getLegacyRoomHistoryList = (_params: LegacyRoomListParams = {}) =>
  rejectUnsupportedLatestApiDoc();

export const getBusinessGroupInfo = async (roomId: string | number) => {
  const normalizedRoomId = normalizeGroupText(roomId);
  if (!normalizedRoomId) {
    return undefined;
  }

  try {
    const response = await getOpenIMGroupDetail({ roomId: normalizedRoomId });
    const groupInfo = normalizeBusinessGroup(response, normalizedRoomId);

    if (groupInfo) {
      return groupInfo;
    }
  } catch (error) {
    // Fall back to the old room endpoint below.
  }

  return undefined;
};

export const joinBusinessGroup = (_params: JoinBusinessGroupParams) =>
  rejectUnsupportedLatestApiDoc();

export const createBusinessGroup = async (params: CreateBusinessGroupParams) => {
  const room =
    typeof params.room === "string" ? normalizeGroupText(params.room) : params.room;
  const roomRecord = typeof room === "string" ? {} : room;
  const name =
    typeof room === "string"
      ? room
      : pickBusinessText(roomRecord, ["name", "roomName", "groupName", "subject"]);

  if (!name) {
    return emptyGroupResponse();
  }

  return businessRequest.post<unknown>("/room/add", undefined, {
    params: normalizeGroupParams({
      name,
      showMember: roomRecord.showMember,
      allowUploadFile: roomRecord.allowUploadFile,
    }),
  });
};

export const addBusinessGroupMembers = (_params: AddBusinessGroupMembersParams) =>
  rejectUnsupportedLatestApiDoc();

export const deleteBusinessGroupMember = (_params: GroupMemberDeleteParams) =>
  rejectUnsupportedLatestApiDoc();

export const deleteBusinessGroup = (_params: GroupQueryParams) =>
  rejectUnsupportedLatestApiDoc();

export const transferBusinessGroupOwner = (_params: TransferBusinessGroupParams) =>
  rejectUnsupportedLatestApiDoc();

export const setBusinessGroupAdmin = (_params: SetBusinessGroupAdminParams) =>
  rejectUnsupportedLatestApiDoc();

export const updateRoomSettings = (_params: RoomSettingsParams) =>
  rejectUnsupportedLatestApiDoc();

export const getOpenIMGroupMembers = (params: GroupMemberListParams) => {
  const normalizedParams = normalizeRoomParams(params);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.get<unknown>("/room/openim/members", {
    params: {
      pageIndex: 0,
      pageSize: 50,
      ...normalizedParams,
    },
  });
};

export const getLegacyGroupMembersByPage = (params: GroupMemberListParams) => {
  return getOpenIMGroupMembers(params);
};

export const getLegacyGroupMembersByKeyword = (params: GroupMemberListParams) => {
  return getOpenIMGroupMembers(params);
};

export const getLegacyGroupMember = (params: MemberTargetParams) => {
  const normalizedParams = normalizeRequiredGroupParams(params, [
    "roomId",
    "targetUserId",
  ]);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.get<unknown>("/room/openim/member/detail", {
    params: {
      roomId: normalizedParams.roomId,
      userId: normalizedParams.targetUserId,
    },
  });
};

export const getLegacyGroupMemberInviterInfo = (_params: MemberTargetParams) =>
  rejectUnsupportedLatestApiDoc();

export const getOpenIMOnlineMembers = (params: GroupMemberListParams) => {
  const normalizedParams = normalizeRoomParams(params);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.get<unknown>("/room/openim/online-members", {
    params: {
      pageIndex: 0,
      pageSize: 50,
      ...normalizedParams,
    },
  });
};

export const getOpenIMGroupShares = (params: GroupShareListParams) => {
  const normalizedParams = normalizeRoomParams(params);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.get<unknown>("/room/openim/shares", {
    params: {
      pageIndex: 0,
      pageSize: 50,
      userId: 0,
      ...normalizedParams,
    },
  });
};

export const getOpenIMGroupShare = (params: DeleteGroupShareParams) => {
  const normalizedParams = normalizeRequiredGroupParams(params, ["roomId", "shareId"]);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.get<unknown>("/room/openim/share/detail", {
    params: normalizedParams,
  });
};

export const getLegacyGroupShares = (params: GroupShareListParams) => {
  return getOpenIMGroupShares(params);
};

export const getLegacyGroupShare = (params: DeleteGroupShareParams) => {
  return getOpenIMGroupShare(params);
};

export const addOpenIMGroupShare = (params: AddGroupShareParams) => {
  const normalizedParams = normalizeRequiredGroupParams(params, [
    "roomId",
    "type",
    "size",
    "url",
    "name",
  ]);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.post<unknown>("/room/openim/share/add", undefined, {
    params: normalizedParams,
  });
};

export const addLegacyGroupShare = (params: AddGroupShareParams) =>
  addOpenIMGroupShare(params);

export const deleteOpenIMGroupShare = (params: DeleteGroupShareParams) => {
  const normalizedParams = normalizeRequiredGroupParams(params, ["roomId", "shareId"]);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.post<unknown>("/room/openim/share/delete", undefined, {
    params: normalizedParams,
  });
};

export const deleteLegacyGroupShare = (params: DeleteGroupShareParams) => {
  return deleteOpenIMGroupShare(params);
};

export const getOpenIMGroupHelperContext = (params?: Partial<GroupQueryParams>) => {
  return businessRequest.get<unknown>("/room/openim/group-helpers/context", {
    params: normalizeGroupParams(params),
  });
};

export const getOpenIMGroupHelpers = (params: GroupHelperListParams) => {
  const normalizedParams = normalizeRoomParams(params);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.get<unknown>("/room/openim/group-helpers", {
    params: normalizedParams,
  });
};

export const getAvailableOpenIMGroupHelpers = (
  params: AvailableGroupHelperListParams,
) => {
  const normalizedParams = normalizeRoomParams(params);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.get<unknown>("/room/openim/group-helpers/available", {
    params: {
      pageIndex: 0,
      pageSize: 50,
      ...normalizedParams,
    },
  });
};

export const addOpenIMGroupHelper = (params: AddGroupHelperParams) => {
  const normalizedParams = normalizeRequiredGroupParams(params, ["roomId", "helperId"]);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.post<unknown>("/room/openim/group-helpers/add", undefined, {
    params: normalizedParams,
  });
};

export const addLegacyGroupHelper = (params: AddGroupHelperParams) => {
  return addOpenIMGroupHelper(params);
};

export const deleteOpenIMGroupHelper = (params: DeleteGroupHelperParams) => {
  const normalizedParams = normalizeRequiredGroupParams(params, [
    "roomId",
    "groupHelperId",
  ]);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.post<unknown>("/room/openim/group-helpers/delete", undefined, {
    params: normalizedParams,
  });
};

export const deleteLegacyGroupHelper = (params: DeleteGroupHelperParams) => {
  return deleteOpenIMGroupHelper(params);
};

export const queryLegacyGroupHelper = (params: AddGroupHelperParams) => {
  return getOpenIMGroupHelpers({
    roomId: params.roomId,
    helperId: params.helperId,
  });
};

export const addOpenIMGroupHelperKeyword = (params: GroupHelperKeywordParams) => {
  const normalizedParams = normalizeRequiredGroupParams(params, [
    "roomId",
    "groupHelperId",
    "keyword",
    "value",
  ]);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.post<unknown>(
    "/room/openim/group-helpers/keywords/add",
    undefined,
    { params: normalizedParams },
  );
};

export const addLegacyGroupAutoResponse = (params: GroupHelperKeywordParams) => {
  return addOpenIMGroupHelperKeyword(params);
};

export const updateOpenIMGroupHelperKeyword = (
  params: UpdateGroupHelperKeywordParams,
) => {
  const normalizedParams = normalizeRequiredGroupParams(params, [
    "roomId",
    "groupHelperId",
    "keyWordId",
    "keyword",
    "value",
  ]);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.post<unknown>(
    "/room/openim/group-helpers/keywords/update",
    undefined,
    { params: normalizedParams },
  );
};

export const updateLegacyGroupAutoResponse = (
  params: UpdateGroupHelperKeywordParams,
) => {
  return updateOpenIMGroupHelperKeyword(params);
};

export const deleteOpenIMGroupHelperKeyword = (
  params: DeleteGroupHelperKeywordParams,
) => {
  const normalizedParams = normalizeRequiredGroupParams(params, [
    "roomId",
    "groupHelperId",
    "keyWordId",
  ]);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.post<unknown>(
    "/room/openim/group-helpers/keywords/delete",
    undefined,
    { params: normalizedParams },
  );
};

export const deleteLegacyGroupAutoResponse = (
  params: DeleteGroupHelperKeywordParams,
) => {
  return deleteOpenIMGroupHelperKeyword(params);
};

export const getOpenIMSpecialMembers = (params: GroupQueryParams) => {
  const normalizedParams = normalizeRoomParams(params);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.get<unknown>("/room/openim/special-members", {
    params: {
      pageIndex: 0,
      pageSize: 50,
      ...normalizedParams,
    },
  });
};

export const setOpenIMSpecialRole = (params: SpecialRoleParams) => {
  const normalizedParams = normalizeRequiredGroupParams(params, [
    "roomId",
    "userId",
    "role",
  ]);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.post<unknown>(
    "/room/openim/member/set-special-role",
    undefined,
    {
      params: normalizedParams,
    },
  );
};

export const setLegacyInvisibleGuardian = (params: LegacyInvisibleGuardianParams) => {
  const role = params.type === 4 || params.type === 5 ? params.type : 3;

  return setOpenIMSpecialRole({
    roomId: params.roomId,
    userId: params.touserId,
    role,
  });
};

export const updateOpenIMMemberRemark = (params: MemberRemarkParams) => {
  const normalizedParams = normalizeRequiredGroupParams(params, [
    "roomId",
    "targetUserId",
  ]);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.post<unknown>("/room/openim/member/remark/update", undefined, {
    params: normalizedParams,
  });
};

export const deleteOpenIMMemberRemark = (params: MemberTargetParams) => {
  const normalizedParams = normalizeRequiredGroupParams(params, [
    "roomId",
    "targetUserId",
  ]);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.post<unknown>("/room/openim/member/remark/update", undefined, {
    params: { ...normalizedParams, remarkName: "" },
  });
};

export const muteOpenIMGroupMember = (_params: MemberMuteParams) =>
  rejectUnsupportedLatestApiDoc();

export const unmuteOpenIMGroupMember = (_params: MemberTargetParams) =>
  rejectUnsupportedLatestApiDoc();

export const getOpenIMGroupNotices = (params: GroupQueryParams) => {
  const normalizedParams = normalizeRoomParams(params);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.get<unknown>("/room/openim/notices", {
    params: {
      pageIndex: 0,
      pageSize: 20,
      ...normalizedParams,
    },
  });
};

export const getLegacyGroupNoticesPage = (params: LegacyGroupNoticeListParams) => {
  return getOpenIMGroupNotices(params);
};

export const searchLegacyGroupNotices = (params: LegacyGroupNoticeListParams) => {
  return getOpenIMGroupNotices(params);
};

export const addOpenIMGroupNotice = (params: AddGroupNoticeParams) => {
  const normalizedParams = normalizeNoticeParams(params);
  if (
    !normalizeGroupText(normalizedParams.roomId) ||
    !normalizeGroupText(normalizedParams.noticeContent)
  ) {
    return emptyGroupResponse();
  }

  return businessRequest.post<unknown>("/room/openim/notice/add", undefined, {
    params: normalizedParams,
  });
};

export const updateOpenIMGroupNotice = (params: UpdateGroupNoticeParams) => {
  const normalizedParams = normalizeNoticeParams(params);
  if (
    !normalizeGroupText(normalizedParams.roomId) ||
    !normalizeGroupText(normalizedParams.noticeId) ||
    !normalizeGroupText(normalizedParams.noticeContent)
  ) {
    return emptyGroupResponse();
  }

  return businessRequest.post<unknown>("/room/openim/notice/update", undefined, {
    params: normalizedParams,
  });
};

export const updateLegacyGroupNotice = (params: UpdateGroupNoticeParams) => {
  return updateOpenIMGroupNotice(params);
};

export const deleteOpenIMGroupNotice = (params: GroupNoticeParams) => {
  const normalizedParams = normalizeRequiredGroupParams(params, ["roomId", "noticeId"]);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.post<unknown>("/room/openim/notice/delete", undefined, {
    params: normalizedParams,
  });
};

export const deleteLegacyGroupNotice = (params: GroupNoticeParams) => {
  return deleteOpenIMGroupNotice(params);
};

export const getOpenIMJoinRequests = (params: JoinRequestParams) => {
  const normalizedParams = normalizeRoomParams(params);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.get<unknown>("/room/openim/join-requests", {
    params: {
      pageIndex: 0,
      pageSize: 20,
      status: -1,
      ...normalizedParams,
    },
  });
};

export const handleOpenIMJoinRequest = (params: HandleJoinRequestParams) => {
  const normalizedParams = normalizeJoinHandleParams(params);
  if (
    !normalizeGroupText(normalizedParams.requestId) ||
    !normalizeGroupText(normalizedParams.action)
  ) {
    return emptyGroupResponse();
  }

  return businessRequest.post<unknown>("/room/openim/join-requests/handle", undefined, {
    params: normalizedParams,
  });
};

export const getOpenIMMessageReadDetail = (params: MessageReadDetailParams) => {
  const normalizedParams = normalizeRoomParams(params);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }
  const seq = normalizeGroupNumber(params.seq);
  delete normalizedParams.seq;
  if (seq !== undefined) {
    normalizedParams.seq = seq;
  }
  if (!hasMessageLocator(normalizedParams)) {
    return emptyGroupResponse();
  }

  return businessRequest.get<unknown>("/room/openim/message/read-detail", {
    params: normalizedParams,
  });
};

export const setOpenIMGroupOfflineNoPush = (params: GroupOfflineNoPushParams) => {
  const normalizedParams = normalizeRequiredGroupParams(params, [
    "roomId",
    "offlineNoPushMsg",
  ]);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.post<unknown>(
    "/room/openim/member/set-offline-no-push",
    undefined,
    { params: normalizedParams },
  );
};

export const setLegacyGroupMemberOfflineNoPush = (
  params: LegacyGroupMemberSettingParams,
) => {
  if (params.type === 1) {
    return setOpenIMGroupTop({
      roomId: params.roomId,
      top: params.offlineNoPushMsg,
    });
  }

  return setOpenIMGroupOfflineNoPush(params);
};

export const setOpenIMGroupTop = (params: GroupTopParams) => {
  const normalizedParams = normalizeRequiredGroupParams(params, ["roomId", "top"]);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.post<unknown>("/room/openim/member/set-top", undefined, {
    params: normalizedParams,
  });
};

export const clearOpenIMGroupMessages = (params: GroupQueryParams) => {
  const normalizedParams = normalizeRoomParams(params);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.post<unknown>("/room/openim/member/clear-message", undefined, {
    params: normalizedParams,
  });
};

export const setLegacyGroupMemberBeginMsgTime = (params: GroupQueryParams) => {
  return clearOpenIMGroupMessages(params);
};

export const getLegacyGroupSendMsgStatus = (_params: GroupJidParams) =>
  rejectUnsupportedLatestApiDoc();

export const changeLegacyGroupSendMsgStatus = (_params: GroupJidParams) =>
  rejectUnsupportedLatestApiDoc();

export const createOpenIMGroupQRCode = (params: GroupQRCodeCreateParams) => {
  const normalizedParams = normalizeRoomParams(params);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }
  const expireHours = normalizeGroupNumber(params.expireHours);
  delete normalizedParams.expireHours;
  if (expireHours !== undefined) {
    normalizedParams.expireHours = expireHours;
  }

  return businessRequest.post<unknown>("/room/openim/qr/create", undefined, {
    params: normalizedParams,
  });
};

export const resolveOpenIMGroupQRCode = (code: string) => {
  const normalizedCode = normalizeGroupText(code);
  if (!normalizedCode) {
    return emptyGroupResponse();
  }

  return businessRequest.get<unknown>("/room/openim/qr/resolve", {
    params: {
      code: normalizedCode,
    },
  });
};

export const joinOpenIMGroupByQRCode = (params: GroupQRCodeJoinParams) => {
  const normalizedParams = normalizeRequiredGroupParams(params, ["code"]);
  if (!normalizedParams) {
    return emptyGroupResponse();
  }

  return businessRequest.post<unknown>("/room/openim/qr/join", undefined, {
    params: normalizedParams,
  });
};
