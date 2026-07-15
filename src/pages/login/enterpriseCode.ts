import { t } from "i18next";

import { DEFAULT_ENTERPRISE_CODE, validateEnterpriseCode } from "@/api/login";

export const normalizeEnterpriseCode = (code?: string) => {
  return code?.trim() || DEFAULT_ENTERPRISE_CODE;
};

export const validateEnterpriseCodeInput = async (code?: string) => {
  const nextCode = normalizeEnterpriseCode(code);

  if (!nextCode) {
    throw new Error(t("toast.inputEnterpriseCode"));
  }

  return validateEnterpriseCode(nextCode);
};
