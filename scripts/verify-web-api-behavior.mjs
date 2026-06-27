import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const readSource = (filePath) => fs.readFileSync(path.join(root, filePath), "utf8");

const files = {
  errorHandle: "src/api/errorHandle.ts",
  loginApi: "src/api/login.ts",
  loginForm: "src/pages/login/LoginForm.tsx",
  request: "src/utils/request.ts",
  storage: "src/utils/storage.ts",
  chatFooter: "src/pages/chat/queryChat/ChatFooter/index.tsx",
  contactStore: "src/store/contact.ts",
  sendMessage: "src/pages/chat/queryChat/ChatFooter/useSendMessage.ts",
  fileApi: "src/api/file.ts",
  leftNavBar: "src/layout/LeftNavBar/index.tsx",
  remoteE2e: "scripts/verify-web-api-e2e.mjs",
  uiE2e: "e2e/web-api-ui.spec.ts",
  userStore: "src/store/user.ts",
};

const source = Object.fromEntries(
  Object.entries(files).map(([key, filePath]) => [key, readSource(filePath)]),
);

const checks = [];

const addCheck = (name, passed, detail) => {
  checks.push({
    name,
    passed,
    detail,
  });
};

const contains = (text, snippet) => text.includes(snippet);

const appearsBefore = (text, before, after) => {
  const beforeIndex = text.indexOf(before);
  const afterIndex = text.indexOf(after);
  return beforeIndex !== -1 && afterIndex !== -1 && beforeIndex < afterIndex;
};

addCheck(
  "account scoped cache key includes current account",
  contains(
    source.storage,
    'return `IM_ACCOUNT:${currentAccountKey ?? "anonymous"}:${key}`;',
  ),
  files.storage,
);

addCheck(
  "saved account key is derived from userID",
  contains(source.storage, "const accountKey = profile.userID;"),
  files.storage,
);

addCheck(
  "switch account rewrites tokens and current account key",
  [
    "setTMToken(targetAccount.imToken)",
    "setChatToken(targetAccount.chatToken)",
    "setTMUserID(targetAccount.userID)",
    "localForage.setItem(CURRENT_ACCOUNT_KEY, targetAccount.accountKey)",
  ].every((snippet) => contains(source.storage, snippet)),
  files.storage,
);

addCheck(
  "switch account logs out SDK before profile switch",
  appearsBefore(
    source.leftNavBar,
    "await IMSDK.logout().catch(() => undefined);",
    "await switchIMProfile(account.accountKey);",
  ),
  files.leftNavBar,
);

addCheck(
  "switch account clears in-memory stores before reload",
  appearsBefore(
    source.leftNavBar,
    "await switchIMProfile(account.accountKey);",
    "useContactStore.getState().clearContactStore();",
  ) &&
    appearsBefore(
      source.leftNavBar,
      "await switchIMProfile(account.accountKey);",
      "useConversationStore.getState().clearConversationStore();",
    ) &&
    appearsBefore(
      source.leftNavBar,
      "useConversationStore.getState().clearConversationStore();",
      "window.location.reload();",
    ),
  files.leftNavBar,
);

addCheck(
  "switch account reloads into chat route",
  appearsBefore(
    source.leftNavBar,
    'window.location.hash = "#/chat";',
    "window.location.reload();",
  ),
  files.leftNavBar,
);

addCheck(
  "left nav exposes stable saved-account switch selectors",
  contains(source.leftNavBar, 'data-testid="profile-menu-trigger"') &&
    contains(source.leftNavBar, 'data-testid="saved-account-switch"') &&
    contains(source.leftNavBar, "data-account-key={account.accountKey}"),
  files.leftNavBar,
);

addCheck(
  "logout clears profile and in-memory stores before login route",
  appearsBefore(
    source.userStore,
    "await clearIMProfile();",
    'router.navigate("/login");',
  ) &&
    appearsBefore(
      source.userStore,
      "useContactStore.getState().clearContactStore();",
      'router.navigate("/login");',
    ) &&
    appearsBefore(
      source.userStore,
      "useConversationStore.getState().clearConversationStore();",
      'router.navigate("/login");',
    ),
  files.userStore,
);

addCheck(
  "login success saves profile before chat redirect",
  appearsBefore(source.loginForm, "await setIMProfile({", 'navigate("/chat")'),
  files.loginForm,
);

addCheck(
  "login mutation uses backend error handler",
  contains(source.loginApi, "export const useLogin = () =>") &&
    contains(source.loginApi, "onError: errorHandle"),
  files.loginApi,
);

addCheck(
  "request rejects business resultCode failures",
  contains(source.request, 'if ("resultCode" in data)') &&
    contains(source.request, "data.resultCode !== 1") &&
    contains(source.request, "return Promise.reject(data);"),
  files.request,
);

addCheck(
  "error handler displays backend rejection text",
  [
    "errData.errMsg",
    "errData.resultMsg",
    "errData.msg",
    "errData.message",
    "message.error(errorMessage)",
  ].every((snippet) => contains(source.errorHandle, snippet)),
  files.errorHandle,
);

addCheck(
  "ui e2e asserts login response and chat redirect",
  contains(source.uiE2e, 'response.url().includes("/account/login")') &&
    contains(source.uiE2e, "expect(loginResponse.ok()).toBeTruthy();") &&
    contains(source.uiE2e, "expect(loginBody.resultCode).toBe(1);") &&
    contains(source.uiE2e, "await expect(page).toHaveURL(/#\\/chat/"),
  files.uiE2e,
);

addCheck(
  "enterprise code is fixed for login flows",
  [
    'export const DEFAULT_ENTERPRISE_CODE = "C3PY9DYPU";',
    "enterpriseCode: DEFAULT_ENTERPRISE_CODE",
    "invitationCode: DEFAULT_ENTERPRISE_CODE",
  ].every((snippet) => contains(source.loginApi, snippet)) &&
    contains(source.uiE2e, 'const enterpriseCode = "C3PY9DYPU";') &&
    contains(source.uiE2e, "toHaveValue(enterpriseCode)") &&
    contains(source.uiE2e, "toBeDisabled()") &&
    contains(source.remoteE2e, 'const defaultEnterpriseCode = "C3PY9DYPU";') &&
    contains(source.remoteE2e, "enterpriseCode: defaultEnterpriseCode") &&
    contains(source.remoteE2e, "invitationCode: defaultEnterpriseCode"),
  files.loginApi,
);

addCheck(
  "ui e2e asserts persisted login profile",
  [
    'readLocalForageItem(page, "IM_CHAT_TOKEN")',
    'readLocalForageItem(page, "IM_TOKEN")',
    'readLocalForageItem(page, "IM_USERID")',
    'readLocalForageItem(page, "IM_WEB_CURRENT_ACCOUNT")',
    'readLocalForageItem(page, "IM_WEB_SAVED_ACCOUNTS")',
    "savedChatToken: expectedProfile?.chatToken",
    "savedImToken: expectedProfile?.imToken",
    "savedUserID: expectedProfile?.userID",
  ].every((snippet) => contains(source.uiE2e, snippet)),
  files.uiE2e,
);

addCheck(
  "ui e2e checks saved-account switch state",
  [
    "OPENIM_E2E_ACCOUNT2_PHONE",
    "OPENIM_E2E_ACCOUNT2_PASSWORD",
    'getByTestId("profile-menu-trigger")',
    '[data-testid="saved-account-switch"][data-account-key="${account1Profile?.userID}"]',
    "currentAccountKey: account1Profile?.userID",
    "chatToken: account1Profile?.chatToken",
    "imToken: account1Profile?.imToken",
    "userID: account1Profile?.userID",
  ].every((snippet) => contains(source.uiE2e, snippet)),
  files.uiE2e,
);

addCheck(
  "remote e2e dry-run lists saved-account UI env",
  [
    "Optional data for Web UI login and saved-account checks",
    "OPENIM_E2E_ACCOUNT1_PHONE",
    "OPENIM_E2E_ACCOUNT1_PASSWORD",
    "OPENIM_E2E_ACCOUNT2_PHONE",
    "OPENIM_E2E_ACCOUNT2_PASSWORD",
    "Run npm run verify:web-api-ui with OPENIM_E2E_ACCOUNT2_PHONE",
  ].every((snippet) => contains(source.remoteE2e, snippet)),
  files.remoteE2e,
);

addCheck(
  "ui e2e checks add-friend search without sending request",
  [
    "OPENIM_E2E_FRIEND_SEARCH_KEYWORD",
    'response.url().includes("/friends/page")',
    'request.url().includes("/friends/add")',
    "extractTotal(searchBody, listItems)",
    "page.getByText(expectedFriendSearchUserId, { exact: true })",
    "No relevant results found",
    "expect(friendAddRequests).toHaveLength(0);",
  ].every((snippet) => contains(source.uiE2e, snippet)),
  files.uiE2e,
);

addCheck(
  "remote e2e checks multi-account token isolation",
  [
    '["userID", "chatToken", "imToken"].forEach((field) => {',
    "Account1 and account2 resolved to the same ${field}",
    "account profiles isolate business token, OpenIM token, and userID",
    'runReadCheck("account2 friends list", "/friends/list", account2.chatToken',
  ].every((snippet) => contains(source.remoteE2e, snippet)),
  files.remoteE2e,
);

addCheck(
  "chat draft uses account scoped storage APIs",
  [
    "getAccountScopedItem<string>(draftKey)",
    "setAccountScopedItem(draftState.key, draftState.html)",
    "removeAccountScopedItem(draftState.key)",
  ].every((snippet) => contains(source.chatFooter, snippet)),
  files.chatFooter,
);

addCheck(
  "chat draft only clears after send starts",
  contains(source.chatFooter, "if (didStartSend && draftKey)") &&
    contains(source.chatFooter, "await removeAccountScopedItem(draftKey);"),
  files.chatFooter,
);

addCheck(
  "new friend business list starts at api doc page 0",
  contains(source.contactStore, "getNewFriendList({ pageIndex: 0, pageSize: 100 })"),
  files.contactStore,
);

addCheck(
  "business blacklist starts at api doc page 0",
  contains(source.contactStore, "pageIndex: 0,\n          pageSize: 100,"),
  files.contactStore,
);

addCheck(
  "group send-before runs before SDK sendMessage",
  appearsBefore(
    source.sendMessage,
    "await groupSendBefore({",
    "await IMSDK.sendMessage(options)",
  ),
  files.sendMessage,
);

addCheck(
  "single send-before runs before SDK sendMessage",
  appearsBefore(
    source.sendMessage,
    "await singleSendBefore({",
    "await IMSDK.sendMessage(options)",
  ),
  files.sendMessage,
);

addCheck(
  "send-before failure returns false when no local push happened",
  contains(source.sendMessage, "let pushed = false;") &&
    contains(source.sendMessage, "return pushed;"),
  files.sendMessage,
);

addCheck(
  "file sign requires fileId at type boundary",
  contains(source.fileApi, "fileId: string | number;"),
  files.fileApi,
);

addCheck(
  "download and preview require signed file params",
  contains(
    source.fileApi,
    "export interface SignedFileParams extends FileSignParams",
  ) &&
    contains(source.fileApi, "expiresAt: string | number;") &&
    contains(source.fileApi, "signature: string;") &&
    contains(source.fileApi, "downloadFileBySign = (params: SignedFileParams)") &&
    contains(source.fileApi, "previewFileBySign = (params: SignedFileParams)"),
  files.fileApi,
);

addCheck(
  "signed download and preview guard missing signature fields",
  contains(source.fileApi, "previewFileBySign(assertSignedFileParams(signParams))") &&
    contains(source.fileApi, "downloadFileBySign(assertSignedFileParams(signParams))"),
  files.fileApi,
);

const failedChecks = checks.filter((check) => !check.passed);

console.log(
  JSON.stringify(
    {
      checkedCount: checks.length,
      failedCount: failedChecks.length,
      checks,
    },
    null,
    2,
  ),
);

if (failedChecks.length > 0) {
  process.exitCode = 1;
}
