import { t } from "i18next";

export const phoneNumberPattern = /^1\d{10}$/;

export const getPhoneNumberRules = () => [
  {
    required: true,
    message: t("toast.inputPhoneNumber"),
  },
  {
    pattern: phoneNumberPattern,
    message: t("toast.inputCorrectPhoneNumber"),
  },
];
