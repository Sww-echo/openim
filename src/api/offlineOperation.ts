import {
  getBusinessListPayload,
  isBusinessRecord,
  unwrapBusinessPayload,
} from "@/utils/businessPayload";
import { getAccountScopedItem, setAccountScopedItem } from "@/utils/storage";

import businessRequest from "./business";

const OFFLINE_OPERATION_TIME_KEY = "BUSINESS_OFFLINE_OPERATION_TIME";
let offlineOperationSyncPromise: Promise<OfflineOperationSyncResult> | undefined;

export interface OfflineOperationSyncResult {
  hasOperations: boolean;
  operations: Record<string, unknown>[];
  payload: unknown;
}

const normalizeOfflineTime = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    return value.trim() || "0";
  }
  return "0";
};

const hasObjectPayload = (payload: unknown) =>
  isBusinessRecord(payload) && Object.keys(payload).length > 0;

export const getOfflineOperations = async (offlineTime: string | number = "0") => {
  const response = await businessRequest.post<unknown>(
    "/user/offlineOperation",
    undefined,
    {
      params: {
        offlineTime: normalizeOfflineTime(offlineTime),
      },
    },
  );
  const payload = unwrapBusinessPayload(response);
  const operations = getBusinessListPayload(response);

  return {
    hasOperations: operations.length > 0 || hasObjectPayload(payload),
    operations,
    payload,
  } satisfies OfflineOperationSyncResult;
};

const doSyncOfflineOperations = async () => {
  const lastOfflineTime =
    (await getAccountScopedItem<string>(OFFLINE_OPERATION_TIME_KEY)) ?? "0";
  const result = await getOfflineOperations(lastOfflineTime);

  await setAccountScopedItem(OFFLINE_OPERATION_TIME_KEY, String(Date.now()));

  return result;
};

export const syncOfflineOperations = () => {
  if (offlineOperationSyncPromise) {
    return offlineOperationSyncPromise;
  }

  offlineOperationSyncPromise = doSyncOfflineOperations().finally(() => {
    offlineOperationSyncPromise = undefined;
  });

  return offlineOperationSyncPromise;
};
