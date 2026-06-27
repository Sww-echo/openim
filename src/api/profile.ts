import {
  getBusinessListPayload,
  isBusinessRecord,
  pickBusinessText,
  unwrapBusinessPayload,
} from "@/utils/businessPayload";

import businessRequest from "./business";

export interface ProfileMeta {
  key: string;
  label: string;
  required?: boolean;
  maxLength?: number;
}

export interface UpdateUserProfileParams {
  nickname: string;
  email?: string;
  description?: string;
  customFields?: Record<string, unknown>;
}

const normalizeProfileText = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const normalizeProfileNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const normalizeProfileMeta = (record: Record<string, unknown>): ProfileMeta | undefined => {
  const key = normalizeProfileText(
    pickBusinessText(record, ["key", "field", "fieldName", "name", "code"]),
  );

  if (!key) {
    return undefined;
  }

  return {
    key,
    label:
      normalizeProfileText(pickBusinessText(record, ["label", "title", "name"])) || key,
    required: Boolean(record.required ?? record.isRequired),
    maxLength: normalizeProfileNumber(record.maxLength ?? record.max),
  };
};

const normalizeCustomFields = (customFields?: Record<string, unknown>) =>
  Object.entries(customFields ?? {}).reduce((nextFields, [key, value]) => {
    const normalizedKey = normalizeProfileText(key);
    if (!normalizedKey) {
      return nextFields;
    }

    const normalizedValue = normalizeProfileText(value);
    if (normalizedValue) {
      nextFields[normalizedKey] = normalizedValue;
    }
    return nextFields;
  }, {} as Record<string, string>);

export const getUserProfileMetas = async () => {
  const response = await businessRequest.post<unknown>("/user/profile/metas");
  const payload = unwrapBusinessPayload(response);
  const list = getBusinessListPayload(response);

  if (list.length) {
    return list
      .map(normalizeProfileMeta)
      .filter((item): item is ProfileMeta => Boolean(item));
  }

  if (!isBusinessRecord(payload)) {
    return [];
  }

  return Object.entries(payload)
    .filter(([, value]) => isBusinessRecord(value))
    .map(([key, value]) =>
      normalizeProfileMeta({
        key,
        ...(value as Record<string, unknown>),
      }),
    )
    .filter((item): item is ProfileMeta => Boolean(item));
};

export const updateUserProfile = ({
  nickname,
  email,
  description,
  customFields,
}: UpdateUserProfileParams) => {
  const normalizedCustomFields = normalizeCustomFields(customFields);
  const customFieldsJson = JSON.stringify(normalizedCustomFields);

  return businessRequest.post<unknown>("/user/profile/update", undefined, {
    params: {
      nickname: normalizeProfileText(nickname),
      email: normalizeProfileText(email),
      description: normalizeProfileText(description),
      customFields: customFieldsJson,
      customFieldsJson,
    },
  });
};
