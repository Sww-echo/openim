import { LocaleString } from "@/store/type";
import * as localForage from "localforage";

localForage.config({
  name: "OpenCorp-Config",
});

const SAVED_ACCOUNTS_KEY = "IM_WEB_SAVED_ACCOUNTS";
const CURRENT_ACCOUNT_KEY = "IM_WEB_CURRENT_ACCOUNT";

export interface IMProfile {
  chatToken: string;
  imToken: string;
  userID: string;
}

export interface WebSavedAccount extends IMProfile {
  accountKey: string;
  account?: string;
  phoneNumber?: string;
  areaCode?: string;
  email?: string;
  nickname?: string;
  faceURL?: string;
  updatedAt: number;
}

export type WebAccountProfile = IMProfile &
  Partial<
    Pick<
      WebSavedAccount,
      "account" | "phoneNumber" | "areaCode" | "email" | "nickname" | "faceURL"
    >
  >;

export const setAreaCode = (areaCode: string) =>
  localStorage.setItem("IM_AREA_CODE", areaCode);
export const setPhoneNumber = (account: string) =>
  localStorage.setItem("IM_PHONE_NUM", account);
export const setEmail = (email: string) => localStorage.setItem("IM_EMAIL", email);
export const setLoginMethod = (method: string) =>
  localStorage.setItem("IM_LOGIN_METHOD", method);
export const setTMToken = (token: string) => localForage.setItem("IM_TOKEN", token);
export const setChatToken = (token: string) =>
  localForage.setItem("IM_CHAT_TOKEN", token);
export const setTMUserID = (userID: string) => localForage.setItem("IM_USERID", userID);
export const setIMProfile = async (profile: WebAccountProfile) => {
  await Promise.all([
    setTMToken(profile.imToken),
    setChatToken(profile.chatToken),
    setTMUserID(profile.userID),
    saveWebAccount(profile),
  ]);
};

export const setLocale = (locale: string) => localStorage.setItem("IM_LOCALE", locale);

export const clearIMProfile = async () => {
  await Promise.all([
    localForage.removeItem("IM_TOKEN"),
    localForage.removeItem("IM_CHAT_TOKEN"),
    localForage.removeItem("IM_USERID"),
    localForage.removeItem(CURRENT_ACCOUNT_KEY),
  ]);
};

export const getAreaCode = () => localStorage.getItem("IM_AREA_CODE");
export const getPhoneNumber = () => localStorage.getItem("IM_PHONE_NUM");
export const getEmail = () => localStorage.getItem("IM_EMAIL");
export const getLoginMethod = () =>
  (localStorage.getItem("IM_LOGIN_METHOD") ?? "phone") as "phone" | "email";
export const getIMToken = async () => await localForage.getItem("IM_TOKEN");
export const getChatToken = async () => await localForage.getItem("IM_CHAT_TOKEN");
export const getIMUserID = async () => await localForage.getItem("IM_USERID");

export const getSavedAccounts = async () =>
  ((await localForage.getItem<WebSavedAccount[]>(SAVED_ACCOUNTS_KEY)) ?? []).filter(
    (account) => account.chatToken && account.imToken && account.userID,
  );

export const getCurrentAccountKey = async () =>
  await localForage.getItem<string>(CURRENT_ACCOUNT_KEY);

export const getAccountScopedKey = async (key: string, accountKey?: string) => {
  const currentAccountKey = accountKey ?? (await getCurrentAccountKey());
  return `IM_ACCOUNT:${currentAccountKey ?? "anonymous"}:${key}`;
};

export const getAccountScopedItem = async <T>(key: string, accountKey?: string) =>
  localForage.getItem<T>(await getAccountScopedKey(key, accountKey));

export const setAccountScopedItem = async <T>(
  key: string,
  value: T,
  accountKey?: string,
) => localForage.setItem(await getAccountScopedKey(key, accountKey), value);

export const removeAccountScopedItem = async (key: string, accountKey?: string) =>
  localForage.removeItem(await getAccountScopedKey(key, accountKey));

export const saveWebAccount = async (profile: WebAccountProfile) => {
  const accountKey = profile.userID;
  const savedAccounts = await getSavedAccounts();
  const nextAccount: WebSavedAccount = {
    accountKey,
    ...profile,
    updatedAt: Date.now(),
  };
  const nextAccounts = [
    nextAccount,
    ...savedAccounts.filter((account) => account.accountKey !== accountKey),
  ];

  await Promise.all([
    localForage.setItem(SAVED_ACCOUNTS_KEY, nextAccounts),
    localForage.setItem(CURRENT_ACCOUNT_KEY, accountKey),
  ]);

  return nextAccount;
};

export const switchIMProfile = async (accountKey: string) => {
  const targetAccount = (await getSavedAccounts()).find(
    (account) => account.accountKey === accountKey,
  );
  if (!targetAccount) {
    throw new Error("Account profile not found");
  }

  await Promise.all([
    setTMToken(targetAccount.imToken),
    setChatToken(targetAccount.chatToken),
    setTMUserID(targetAccount.userID),
    localForage.setItem(CURRENT_ACCOUNT_KEY, targetAccount.accountKey),
  ]);

  return targetAccount;
};

export const updateCurrentIMToken = async (imToken: string, userID?: string) => {
  await setTMToken(imToken);

  const [savedAccounts, currentAccountKey] = await Promise.all([
    getSavedAccounts(),
    getCurrentAccountKey(),
  ]);
  const targetAccountKey = currentAccountKey ?? userID;

  if (!targetAccountKey) {
    return;
  }

  const nextAccounts = savedAccounts.map((account) =>
    account.accountKey === targetAccountKey
      ? {
          ...account,
          imToken,
          userID: userID ?? account.userID,
          updatedAt: Date.now(),
        }
      : account,
  );

  await localForage.setItem(SAVED_ACCOUNTS_KEY, nextAccounts);
};

export const removeSavedAccount = async (accountKey: string) => {
  const savedAccounts = await getSavedAccounts();
  const nextAccounts = savedAccounts.filter(
    (account) => account.accountKey !== accountKey,
  );
  const currentAccountKey = await getCurrentAccountKey();

  await localForage.setItem(SAVED_ACCOUNTS_KEY, nextAccounts);
  if (currentAccountKey === accountKey) {
    await clearIMProfile();
  }
};

export const getLocale = (): LocaleString =>
  window.electronAPI?.ipcSendSync("getKeyStoreSync", { key: "language" }) ||
  (localStorage.getItem("IM_LOCALE") as LocaleString) ||
  window.navigator.language ||
  "en-US";
