import businessRequest from "./business";

export interface AnnouncementListParams {
  status?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface AnnouncementDetailParams {
  announcementId: string | number;
}

const normalizeAnnouncementText = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const normalizeAnnouncementParams = (params?: Record<string, unknown>) =>
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

export const getSystemAnnouncements = (params?: AnnouncementListParams) =>
  businessRequest.post<unknown>("/system/announcements", undefined, {
    params: {
      pageIndex: 0,
      pageSize: 20,
      ...normalizeAnnouncementParams(params),
    },
  });

export const getSystemAnnouncementDetail = (params: AnnouncementDetailParams) => {
  const announcementId = normalizeAnnouncementText(params.announcementId);
  if (!announcementId) {
    return Promise.resolve({});
  }

  return businessRequest.post<unknown>("/system/announcements/detail", undefined, {
    params: {
      ...params,
      announcementId,
    },
  });
};

export const markSystemAnnouncementRead = (params: AnnouncementDetailParams) => {
  const announcementId = normalizeAnnouncementText(params.announcementId);
  if (!announcementId) {
    return Promise.resolve({});
  }

  return businessRequest.post<unknown>("/system/announcements/read", undefined, {
    params: {
      ...params,
      announcementId,
    },
  });
};

export const markAllSystemAnnouncementsRead = () =>
  businessRequest.post<unknown>("/system/announcements/read-all");

export const getSystemAnnouncementUnreadCount = () =>
  businessRequest.post<unknown>("/system/announcements/unread-count");
