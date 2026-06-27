import {
  getBusinessListPayload,
  isBusinessRecord,
  pickBusinessText,
  unwrapBusinessPayload,
} from "@/utils/businessPayload";

import businessRequest from "./business";

export type NotificationScope = "global" | "room" | string;

export interface NotificationSettingItem {
  type: string;
  scope?: NotificationScope;
  roomId?: string;
  allowNotification: boolean;
}

export interface NotificationTypeMeta {
  type: string;
  label: string;
  description?: string;
}

export interface NotificationSettings {
  items: NotificationSettingItem[];
  supportedTypes: string[];
  typeMetas: NotificationTypeMeta[];
  scope: NotificationScope;
  roomId: string;
  defaultAllowAll: boolean;
}

export interface UpdateNotificationSettingParams {
  items: NotificationSettingItem[];
}

const normalizeNotificationText = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const toBoolean = (value: unknown, fallback = true) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  if (typeof value === "string") {
    if (["1", "true", "yes"].includes(value.toLowerCase())) {
      return true;
    }
    if (["0", "false", "no"].includes(value.toLowerCase())) {
      return false;
    }
  }
  return fallback;
};

const normalizeSettingItem = (
  payload: unknown,
  fallbackAllow = true,
): NotificationSettingItem | undefined => {
  if (!isBusinessRecord(payload)) {
    return undefined;
  }

  const type = normalizeNotificationText(
    pickBusinessText(payload, ["type", "notificationType", "key"]),
  );
  if (!type) {
    return undefined;
  }

  return {
    type,
    scope: normalizeNotificationText(pickBusinessText(payload, ["scope"])) || "global",
    roomId: normalizeNotificationText(pickBusinessText(payload, ["roomId", "roomID"])),
    allowNotification: toBoolean(payload.allowNotification, fallbackAllow),
  };
};

const normalizeNotificationSettings = (response: unknown): NotificationSettings => {
  const payload = unwrapBusinessPayload(response);
  const record = isBusinessRecord(payload) ? payload : {};
  const defaultAllowAll = toBoolean(record.defaultAllowAll, true);
  const items = getBusinessListPayload(record)
    .map((item) => normalizeSettingItem(item, defaultAllowAll))
    .filter((item): item is NotificationSettingItem => Boolean(item));
  const supportedTypes = Array.isArray(record.supportedTypes)
    ? record.supportedTypes.map(normalizeNotificationText).filter(Boolean)
    : items.map((item) => item.type);
  const typeMetas = Array.isArray(record.typeMetas)
    ? record.typeMetas.filter(isBusinessRecord).map((item) => ({
        type: normalizeNotificationText(pickBusinessText(item, ["type"])),
        label: normalizeNotificationText(
          pickBusinessText(item, ["label", "name", "title"]),
        ),
        description: normalizeNotificationText(
          pickBusinessText(item, ["description", "desc"]),
        ),
      }))
    : [];

  return {
    items,
    supportedTypes,
    typeMetas,
    scope: normalizeNotificationText(pickBusinessText(record, ["scope"])) || "global",
    roomId: normalizeNotificationText(pickBusinessText(record, ["roomId", "roomID"])),
    defaultAllowAll,
  };
};

export const getNotificationSettings = async (roomId?: string | number) => {
  const normalizedRoomId = normalizeNotificationText(roomId);

  return normalizeNotificationSettings(
    await businessRequest.post<unknown>("/user/notification/settings", undefined, {
      params: normalizedRoomId
        ? {
            roomId: normalizedRoomId,
          }
        : undefined,
    }),
  );
};

export const getDefaultNotificationSettings = async () =>
  normalizeNotificationSettings(
    await businessRequest.post<unknown>("/user/notification/settings/defaults"),
  );

export const updateNotificationSettings = ({
  items,
}: UpdateNotificationSettingParams) => {
  const normalizedItems = items
    .map((item) => {
      const type = normalizeNotificationText(item.type);
      const scope = normalizeNotificationText(item.scope) || "global";
      const roomId = normalizeNotificationText(item.roomId);

      if (!type) {
        return undefined;
      }

      return {
        type,
        scope,
        ...(roomId ? { roomId } : {}),
        allowNotification: toBoolean(item.allowNotification, false),
      };
    })
    .filter((item): item is NotificationSettingItem => Boolean(item));

  if (!normalizedItems.length) {
    return Promise.resolve({});
  }

  return businessRequest.post<unknown>("/user/notification/settings/update", undefined, {
    params: {
      items: JSON.stringify(normalizedItems),
    },
  });
};
