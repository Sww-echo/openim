import { t } from "i18next";

import { DEFAULT_ENTERPRISE_CODE, validateEnterpriseCode } from "@/api/login";
import { isBusinessRecord, unwrapBusinessPayload } from "@/utils/businessPayload";

export const normalizeEnterpriseCode = (code?: string) => {
  return code?.trim() || DEFAULT_ENTERPRISE_CODE;
};

const isInvalidEnterpriseResult = (value: unknown) =>
  value === false || value === 0 || value === "0" || value === "false";

export const validateEnterpriseCodeInput = async (code?: string) => {
  const nextCode = normalizeEnterpriseCode(code);

  if (!nextCode) {
    return undefined;
  }

  const response = await validateEnterpriseCode(nextCode);
  const payload = unwrapBusinessPayload(response);

  if (isBusinessRecord(payload)) {
    const valid = payload.valid ?? payload.isValid;
    if (isInvalidEnterpriseResult(valid)) {
      throw new Error(t("errCode.enterpriseCodeInvalid"));
    }
  }

  return nextCode;
};
