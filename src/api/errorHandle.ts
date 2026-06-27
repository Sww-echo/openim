import { message } from "@/AntdGlobalComp";
import { ErrCodeMap } from "@/constants";
import { getFeedbackErrorMessage } from "@/utils/common";

interface ErrorData {
  errCode?: number;
  errMsg?: string;
  resultCode?: number;
  resultMsg?: string;
  msg?: string;
  message?: string;
  errDlt?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getErrorData = (err: unknown): ErrorData => {
  if (!isRecord(err)) {
    return {};
  }

  const response = err.response;
  if (isRecord(response) && isRecord(response.data)) {
    return response.data as ErrorData;
  }

  if (isRecord(err.data)) {
    return err.data as ErrorData;
  }

  return err as ErrorData;
};

export const errorHandle = (err: unknown) => {
  if (typeof err === "string") {
    message.error(err);
    return;
  }

  const errData = getErrorData(err);
  const errorMessage =
    (errData.errCode ? ErrCodeMap[errData.errCode] : undefined) ||
    getFeedbackErrorMessage(err);

  if (errorMessage) {
    message.error(errorMessage);
  }
};
