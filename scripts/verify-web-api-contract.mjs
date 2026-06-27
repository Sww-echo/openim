import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const readText = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const parseEnv = (relativePath) =>
  readText(relativePath)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce((env, line) => {
      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) {
        return env;
      }
      env[line.slice(0, separatorIndex).trim()] = line.slice(separatorIndex + 1).trim();
      return env;
    }, {});

const apiDoc = JSON.parse(readText("docs/openim-frontend-api-doc.json"));
const env = parseEnv(".env");
const source = {
  business: readText("src/api/business.ts"),
  chat: readText("src/api/chat.ts"),
  file: readText("src/api/file.ts"),
  friend: readText("src/api/friend.ts"),
  group: readText("src/api/group.ts"),
  login: readText("src/api/login.ts"),
  request: readText("src/utils/request.ts"),
  e2e: readText("scripts/verify-web-api-e2e.mjs"),
  uiE2e: readText("e2e/web-api-ui.spec.ts"),
  fileMessage: readText(
    "src/pages/chat/queryChat/ChatFooter/SendActionBar/useFileMessage.ts",
  ),
  sendActionBar: readText(
    "src/pages/chat/queryChat/ChatFooter/SendActionBar/index.tsx",
  ),
  chatBusinessResources: readText(
    "src/pages/chat/queryChat/ChatHeader/ChatBusinessResources.tsx",
  ),
  groupBusinessEntrances: readText(
    "src/pages/chat/queryChat/GroupSetting/GroupBusinessEntrances.tsx",
  ),
  groupSettings: readText("src/pages/chat/queryChat/GroupSetting/GroupSettings.tsx"),
  leftNavBar: readText("src/layout/LeftNavBar/index.tsx"),
  globalEvents: readText("src/layout/useGlobalEvents.tsx"),
  userStore: readText("src/store/user.ts"),
  singleSetting: readText("src/pages/chat/queryChat/SingleSetting/index.tsx"),
  proxy: readText("vite.proxy.ts"),
  vite: readText("vite.config.ts"),
  legacy: readText("vite.legacy.config.ts"),
  web: readText("vite.web.config.ts"),
};

const checks = [];

const addCheck = (name, passed, detail) => {
  checks.push({
    name,
    passed,
    detail,
  });
};

const getOperations = (apiPath) =>
  (apiDoc.operations ?? []).filter((operation) => operation.path === apiPath);

const getParam = (apiPath, name) =>
  getOperations(apiPath)
    .flatMap((operation) => operation.parameters ?? [])
    .find((param) => param.name === name);

const expectApiDocParam = (apiPath, name, location, required) => {
  const param = getParam(apiPath, name);
  addCheck(
    `api doc ${apiPath} ${name} is ${location}${required ? " required" : ""}`,
    Boolean(param && param.in === location && Boolean(param.required) === required),
    param
      ? `${apiPath} ${name} actual=${param.in} required=${Boolean(param.required)}`
      : `${apiPath} ${name} missing`,
  );
};

const expectApiDocParamLocation = (apiPath, name, location) => {
  const param = getParam(apiPath, name);
  addCheck(
    `api doc ${apiPath} ${name} is ${location}`,
    Boolean(param && param.in === location),
    param
      ? `${apiPath} ${name} actual=${param.in} required=${Boolean(param.required)}`
      : `${apiPath} ${name} missing`,
  );
};

const expectSnippet = (name, fileKey, snippet) => {
  addCheck(name, source[fileKey].includes(snippet), `${fileKey}: ${snippet}`);
};

const expectNotSnippet = (name, fileKey, snippet) => {
  addCheck(name, !source[fileKey].includes(snippet), `${fileKey}: ${snippet}`);
};

const expectPattern = (name, fileKey, pattern) => {
  addCheck(name, pattern.test(source[fileKey]), `${fileKey}: ${pattern}`);
};

[
  ["/account/code/send", "areaCode", "query", true],
  ["/account/code/send", "phoneNumber", "query", true],
  ["/account/code/send", "telephone", "query", true],
  ["/account/code/verify", "areaCode", "query", true],
  ["/account/code/verify", "phoneNumber", "query", true],
  ["/account/code/verify", "telephone", "query", true],
  ["/account/code/verify", "verifyCode", "query", true],
  ["/enterprise/code/validate", "code", "query", true],
  ["/friend/openim/messages/search", "peerUserId", "query", true],
  ["/friend/openim/send-before", "toUserId", "query", true],
  ["/room/openim/messages/search", "roomId", "query", true],
  ["/room/openim/message/recall", "roomId", "query", true],
  ["/room/openim/send-before", "roomId", "query", true],
  ["/file/compress", "fileId", "query", true],
  ["/file/convert", "fileId", "query", true],
  ["/file/delete", "fileId", "query", true],
  ["/file/reference/invalidate", "fileId", "query", true],
  ["/file/reference/invalidate", "reason", "query", true],
  ["/file/reference/status", "fileId", "query", true],
  ["/file/resources/detail", "fileId", "query", true],
  ["/file/upload", "file", "formData", true],
  ["/file/upload", "scene", "query", false],
  ["/file/sign", "fileId", "query", true],
  ["/file/download", "fileId", "query", true],
  ["/file/download", "expiresAt", "query", true],
  ["/file/download", "signature", "query", true],
  ["/file/preview", "fileId", "query", true],
  ["/file/preview", "expiresAt", "query", true],
  ["/file/preview", "signature", "query", true],
  ["/room/openim/member/set-special-role", "roomId", "query", true],
  ["/room/openim/member/set-special-role", "userId", "query", true],
  ["/room/openim/member/set-special-role", "role", "query", true],
  ["/room/openim/member/remark/update", "targetUserId", "query", true],
  ["/room/openim/join-requests/handle", "requestId", "query", true],
  ["/room/openim/join-requests/handle", "action", "query", true],
  ["/room/openim/notice/add", "roomId", "query", true],
  ["/room/openim/notice/add", "noticeContent", "query", true],
  ["/room/openim/notice/update", "noticeId", "query", true],
  ["/room/openim/notice/update", "noticeContent", "query", true],
  ["/room/openim/members", "pageIndex", "query", false],
  ["/room/openim/members", "pageSize", "query", false],
  ["/message/merge/preview", "auditIds", "query", true],
  ["/message/merge/save", "auditIds", "query", true],
  ["/message/merge/forward-before", "auditIds", "query", true],
  ["/message/merge/detail", "mergeId", "query", true],
  ["/message/merge/delete", "mergeId", "query", true],
  ["/message/favorites", "pageIndex", "query", false],
  ["/message/favorites", "pageSize", "query", false],
  ["/message/favorites/add", "auditId", "query", false],
  ["/message/favorites/detail", "favoriteId", "query", true],
  ["/message/favorites/delete", "favoriteId", "query", true],
  ["/room/openim/detail", "roomId", "query", true],
  ["/room/openim/join-requests", "roomId", "query", true],
  ["/friends/page", "userId", "query", true],
  ["/friends/page", "pageIndex", "query", false],
  ["/friends/page", "pageSize", "query", false],
  ["/friends/queryBlacklistWeb", "pageIndex", "query", false],
  ["/friends/queryBlacklistWeb", "pageSize", "query", false],
  ["/friends/newFriendListWeb", "userId", "query", true],
  ["/friends/newFriendListWeb", "pageIndex", "query", false],
  ["/friends/newFriendListWeb", "pageSize", "query", false],
  ["/friends/update/OfflineNoPushMsg", "offlineNoPushMsg", "query", true],
  ["/room/openim/member/set-offline-no-push", "offlineNoPushMsg", "query", false],
  ["/room/openim/member/set-top", "top", "query", false],
  ["/room/openim/member/clear-message", "roomId", "query", true],
  ["/room/openim/member/remark/update", "roomId", "query", true],
  ["/room/openim/message/read-detail", "roomId", "query", true],
  ["/room/openim/notice/delete", "roomId", "query", true],
  ["/room/openim/notice/delete", "noticeId", "query", true],
  ["/room/openim/notices", "roomId", "query", true],
  ["/room/openim/notices", "pageIndex", "query", false],
  ["/room/openim/notices", "pageSize", "query", false],
  ["/room/openim/online-members", "roomId", "query", true],
  ["/room/openim/online-members", "pageIndex", "query", false],
  ["/room/openim/online-members", "pageSize", "query", false],
  ["/room/openim/special-members", "roomId", "query", true],
  ["/room/openim/special-members", "pageIndex", "query", false],
  ["/room/openim/special-members", "pageSize", "query", false],
  ["/friends/add", "toUserId", "query", true],
  ["/friends/blacklist/add", "toUserId", "query", true],
  ["/friends/blacklist/delete", "toUserId", "query", true],
  ["/friends/delete", "toUserId", "query", true],
  ["/friends/get", "userId", "query", false],
  ["/friends/get", "toUserId", "query", true],
  ["/friends/list", "userId", "query", false],
  ["/friends/remark", "toUserId", "query", true],
  ["/friends/remark", "remarkName", "query", false],
  ["/friends/remark", "describe", "query", false],
  ["/user/getByAccount", "account", "query", true],
].forEach(([apiPath, name, location, required]) =>
  expectApiDocParam(apiPath, name, location, required),
);

expectApiDocParamLocation("/account/code/send", "invitationCode", "query");
expectApiDocParamLocation("/account/code/verify", "invitationCode", "query");

addCheck(
  "env business api uses proxy path",
  env.VITE_CHAT_URL === "/business-api",
  `VITE_CHAT_URL=${env.VITE_CHAT_URL}`,
);
addCheck(
  "env business api target matches requested backend",
  env.VITE_BUSINESS_API_TARGET === "http://47.238.134.161:8092",
  `VITE_BUSINESS_API_TARGET=${env.VITE_BUSINESS_API_TARGET}`,
);
addCheck(
  "env OpenIM api target matches requested backend",
  env.VITE_API_URL === "http://47.238.134.161:10002",
  `VITE_API_URL=${env.VITE_API_URL}`,
);
addCheck(
  "env OpenIM ws target matches requested backend",
  env.VITE_WS_URL === "ws://47.238.134.161:10001",
  `VITE_WS_URL=${env.VITE_WS_URL}`,
);

expectSnippet(
  "business request uses VITE_CHAT_URL",
  "business",
  "import.meta.env.VITE_CHAT_URL as string",
);
expectSnippet("business request uses business token mode", "business", "false");
expectPattern(
  "request layer defaults to business token when imToken is false",
  "request",
  /const storedToken = imToken\s*\?\s*await getIMToken\(\)\s*:\s*await getChatToken\(\);/,
);
expectSnippet(
  "proxy target reads VITE_BUSINESS_API_TARGET",
  "proxy",
  "env.VITE_BUSINESS_API_TARGET",
);
expectSnippet(
  "proxy strips /business-api prefix",
  "proxy",
  'proxyPath.replace(/^\\/business-api/, "")',
);
["vite", "legacy", "web"].forEach((key) =>
  expectSnippet(
    `${key} config uses shared business proxy`,
    key,
    "createBusinessApiProxy",
  ),
);

expectSnippet(
  "account code params include telephone alias",
  "login",
  "telephone: normalizeAuthText(params.phoneNumber),",
);
expectSnippet(
  "default enterprise code is hardcoded",
  "login",
  'export const DEFAULT_ENTERPRISE_CODE = "LOCALTEST001";',
);
expectSnippet(
  "account code params send hardcoded enterpriseCode",
  "login",
  "enterpriseCode: DEFAULT_ENTERPRISE_CODE",
);
expectSnippet(
  "login sends hardcoded enterpriseCode",
  "login",
  "enterpriseCode: DEFAULT_ENTERPRISE_CODE",
);
expectSnippet(
  "account code send passes query params",
  "login",
  'businessRequest.post("/account/code/send", undefined,',
);
expectSnippet(
  "account code params keep fixed enterprise code and add telephone alias",
  "login",
  "telephone: normalizeAuthText(params.phoneNumber),",
);
expectSnippet(
  "account code verify passes query params",
  "login",
  'businessRequest.post("/account/code/verify", undefined,',
);
expectSnippet(
  "account code verify uses normalized query aliases",
  "login",
  "params: normalizedParams,",
);
expectSnippet(
  "enterprise validate passes code query",
  "login",
  '"/enterprise/code/validate"',
);
expectPattern(
  "enterprise validate uses latest doc GET method",
  "login",
  /businessRequest\.get<EnterpriseCodeValidateResult>\(\s*"\/enterprise\/code\/validate"/,
);
expectPattern(
  "OpenIM token refresh uses latest doc GET method",
  "login",
  /refreshOpenIMToken[\s\S]*businessRequest\.get<LoginSuccessData>\("\/user\/openim\/token"\)/,
);
expectPattern(
  "login normalizes access token",
  "login",
  /const chatToken =[\s\S]*data\.chatToken\s*\?\?\s*data\.access_token/,
);
expectSnippet(
  "login normalizes OpenIM token",
  "login",
  "const imToken = normalizeAuthText(data.imToken ?? data.openIM?.token);",
);
expectSnippet(
  "business request appends access_token query",
  "request",
  'nextParams.set("access_token", token);',
);
expectSnippet(
  "business request skips access_token on public paths",
  "request",
  "businessPublicPaths.has(requestPath)",
);
expectSnippet(
  "login restriction supports ip block reason",
  "login",
  'reason === "user_login_ip_not_allowed"',
);
expectSnippet(
  "login restriction supports curfew reason",
  "login",
  'reason.includes("curfew")',
);
[
  ["/user/logout", ["login", "request", "globalEvents", "userStore"]],
  ["/user/outtime", ["login", "request", "globalEvents", "userStore"]],
  ["/user/password/reset", ["login", "request"]],
  ["/user/password/update", ["login", "request"]],
  ["/user/verify/password", ["login", "request"]],
].forEach(([apiPath, fileKeys]) =>
  fileKeys.forEach((fileKey) =>
    expectNotSnippet(
      `login flow does not call legacy ${apiPath} in ${fileKey}`,
      fileKey,
      apiPath,
    ),
  ),
);
expectSnippet(
  "unsupported password APIs return latest-doc gap error",
  "login",
  "rejectUnsupportedLatestApiDoc",
);
expectNotSnippet(
  "logout no longer calls legacy business logout",
  "userStore",
  "logoutBusinessUser",
);
expectNotSnippet(
  "global restore no longer calls legacy outtime check",
  "globalEvents",
  "checkBusinessAccountOuttime",
);

expectPattern(
  "friend search starts at api doc page 0",
  "friend",
  /"\/friends\/page"[\s\S]*pageIndex:\s*0/,
);
expectPattern(
  "business blacklist starts at api doc page 0",
  "friend",
  /"\/friends\/queryBlacklistWeb"[\s\S]*pageIndex:\s*0/,
);
expectPattern(
  "new friend list starts at api doc page 0",
  "friend",
  /"\/friends\/newFriendListWeb"[\s\S]*pageIndex:\s*0/,
);
expectSnippet(
  "friend setting wrapper targets OfflineNoPushMsg endpoint",
  "friend",
  'businessRequest.post<unknown>("/friends/update/OfflineNoPushMsg", undefined,',
);
expectSnippet(
  "friend setting params require offlineNoPushMsg",
  "friend",
  "export interface FriendSettingsParams {\n  offlineNoPushMsg: 0 | 1 | number;",
);
expectSnippet(
  "friend detail passes current userId and target toUserId",
  "friend",
  "userId,\n      toUserId: normalizedToUserId,",
);
expectSnippet(
  "friend remark passes required remarkName and describe",
  "friend",
  "toUserId: normalizedToUserId,\n      remarkName: remark,\n      describe,",
);
expectSnippet(
  "friend add passes toUserId",
  "friend",
  'businessRequest.post<unknown>("/friends/add", undefined,',
);
expectSnippet(
  "friend blacklist add serializes toUserId",
  "friend",
  "const normalizedToUserId = toUserIdParam(toUserId);",
);
expectSnippet(
  "e2e lists friend search keyword env",
  "e2e",
  "OPENIM_E2E_FRIEND_SEARCH_KEYWORD",
);
expectPattern(
  "e2e covers friend target search",
  "e2e",
  /runReadCheck\(\s*"friend target search",\s*"\/friends\/page"/,
);
expectSnippet(
  "e2e friend search can assert expected user",
  "e2e",
  "OPENIM_E2E_FRIEND_SEARCH_EXPECTED_USER_ID",
);
expectSnippet(
  "e2e lists user account lookup env",
  "e2e",
  "OPENIM_E2E_USER_ACCOUNT_QUERY",
);
expectPattern(
  "e2e covers user account lookup",
  "e2e",
  /runReadCheck\(\s*"user account lookup",\s*"\/user\/getByAccount"/,
);
expectSnippet(
  "e2e user account lookup can assert expected user",
  "e2e",
  "OPENIM_E2E_USER_ACCOUNT_EXPECTED_USER_ID",
);
expectSnippet(
  "e2e dry-run lists UI account1 phone env",
  "e2e",
  "OPENIM_E2E_ACCOUNT1_PHONE",
);
expectSnippet(
  "e2e dry-run lists UI account2 phone env",
  "e2e",
  "OPENIM_E2E_ACCOUNT2_PHONE",
);
expectSnippet(
  "ui e2e lists account2 phone env",
  "uiE2e",
  "const account2PhoneNumber = process.env.OPENIM_E2E_ACCOUNT2_PHONE;",
);
expectSnippet(
  "ui e2e lists account2 password env",
  "uiE2e",
  "const account2Password = process.env.OPENIM_E2E_ACCOUNT2_PASSWORD;",
);
expectSnippet(
  "ui e2e covers saved-account switch",
  "uiE2e",
  'test("switching saved accounts rewrites tokens and user id"',
);
expectSnippet(
  "ui e2e switches via saved account selector",
  "uiE2e",
  '[data-testid="saved-account-switch"][data-account-key="${account1Profile?.userID}"]',
);
expectSnippet(
  "ui e2e asserts switched current account",
  "uiE2e",
  "currentAccountKey: account1Profile?.userID",
);
expectSnippet(
  "ui e2e asserts switched business token",
  "uiE2e",
  "chatToken: account1Profile?.chatToken",
);
expectSnippet(
  "ui e2e asserts switched OpenIM token",
  "uiE2e",
  "imToken: account1Profile?.imToken",
);
expectSnippet(
  "ui e2e asserts switched user id",
  "uiE2e",
  "userID: account1Profile?.userID",
);
expectSnippet(
  "ui e2e add-friend search does not send friend add",
  "uiE2e",
  "expect(friendAddRequests).toHaveLength(0);",
);
expectSnippet(
  "ui e2e add-friend search can assert opened target card",
  "uiE2e",
  "page.getByText(expectedFriendSearchUserId, { exact: true })",
);
expectSnippet(
  "left nav exposes profile menu test selector",
  "leftNavBar",
  'data-testid="profile-menu-trigger"',
);
expectSnippet(
  "left nav exposes saved account switch selector",
  "leftNavBar",
  'data-testid="saved-account-switch"',
);
expectSnippet(
  "left nav exposes saved account key selector",
  "leftNavBar",
  "data-account-key={account.accountKey}",
);
expectPattern(
  "single no-push passes required offlineNoPushMsg",
  "singleSetting",
  /type:\s*0,[\s\S]*offlineNoPushMsg:\s*toBinarySwitch\(checked\),/,
);
expectPattern(
  "single pin passes required offlineNoPushMsg",
  "singleSetting",
  /type:\s*2,[\s\S]*offlineNoPushMsg:\s*toBinarySwitch\(checked\),/,
);

expectSnippet(
  "single send-before uses latest doc GET query params",
  "chat",
  'businessRequest.get<unknown>("/friend/openim/send-before",',
);
expectSnippet(
  "group send-before uses latest doc GET query params",
  "chat",
  'businessRequest.get<unknown>("/room/openim/send-before",',
);
expectNotSnippet(
  "chat send-before no longer calls legacy room endpoint",
  "chat",
  "/room/sendMsgBefore",
);
expectSnippet("single message search starts at api doc page 0", "chat", "pageIndex: 0");
expectSnippet(
  "single message search uses latest doc GET",
  "chat",
  'businessRequest.get<unknown>("/friend/openim/messages/search",',
);
expectSnippet(
  "single message search wrapper requires peerUserId",
  "chat",
  "peerUserId: string;",
);
expectSnippet(
  "group message search uses latest doc GET",
  "chat",
  'businessRequest.get<unknown>("/room/openim/messages/search",',
);
expectSnippet(
  "group message search wrapper requires roomId",
  "chat",
  "roomId: string;",
);
expectSnippet("group recall wrapper requires roomId", "chat", "roomId: string;");
expectSnippet(
  "merge message params serialize auditIds to csv",
  "chat",
  "auditIds: toCsv(auditIds)",
);
expectSnippet(
  "merge preview uses latest doc GET query params",
  "chat",
  'businessRequest.get<unknown>("/message/merge/preview",',
);
expectSnippet(
  "merge forward-before uses latest doc GET query params",
  "chat",
  'businessRequest.get<unknown>("/message/merge/forward-before",',
);
expectSnippet(
  "saved merge list uses latest doc GET",
  "chat",
  'businessRequest.get<unknown>("/message/merge/saved",',
);
expectSnippet(
  "merge context uses latest doc GET",
  "chat",
  'businessRequest.get<unknown>("/message/merge/context")',
);
expectSnippet("merge detail passes mergeId", "chat", '"/message/merge/detail"');
expectSnippet(
  "merge detail uses latest doc GET",
  "chat",
  'businessRequest.get<unknown>("/message/merge/detail",',
);
expectSnippet(
  "favorite list uses latest doc GET",
  "chat",
  'businessRequest.get<unknown>("/message/favorites",',
);
expectSnippet(
  "favorite context uses latest doc GET",
  "chat",
  'businessRequest.get<unknown>("/message/favorites/context")',
);
expectSnippet(
  "favorite detail passes favoriteId",
  "chat",
  '"/message/favorites/detail"',
);
expectSnippet(
  "favorite detail uses latest doc GET",
  "chat",
  'businessRequest.get<unknown>("/message/favorites/detail",',
);
expectSnippet(
  "favorite add normalizes tags",
  "chat",
  "normalizeFavoriteParams(params)",
);
expectNotSnippet(
  "chat resources no longer call legacy user collection list",
  "chat",
  "/user/collection/list",
);
expectNotSnippet(
  "chat resource panel no longer imports legacy user collections",
  "chatBusinessResources",
  "getLegacyUserCollections",
);
expectNotSnippet(
  "chat resource panel no longer calls legacy group shares list",
  "chatBusinessResources",
  "getLegacyGroupShares",
);
expectNotSnippet(
  "chat resource panel no longer calls legacy group share detail",
  "chatBusinessResources",
  "getLegacyGroupShare",
);
expectNotSnippet(
  "send action no longer calls legacy group share add",
  "sendActionBar",
  "addLegacyGroupShare",
);
expectSnippet(
  "chat resource panel uses OpenIM group share detail",
  "chatBusinessResources",
  "getOpenIMGroupShare",
);
expectPattern(
  "e2e covers message favorites list",
  "e2e",
  /runReadCheck\(\s*"message favorites list",\s*"\/message\/favorites"/,
);
expectPattern(
  "e2e covers merge preview",
  "e2e",
  /runReadCheck\(\s*"merge message preview",\s*"\/message\/merge\/preview"/,
);
expectPattern(
  "e2e covers merge forward-before",
  "e2e",
  /runReadCheck\(\s*"merge message forward-before",\s*"\/message\/merge\/forward-before"/,
);

expectSnippet("file upload uses FormData", "file", "const formData = new FormData();");
expectSnippet(
  "file upload appends file field",
  "file",
  'formData.append("file", file);',
);
expectSnippet(
  "file upload sends multipart",
  "file",
  '"Content-Type": "multipart/form-data"',
);
expectSnippet(
  "file upload context passes query params",
  "file",
  "params: normalizeFileParams(params),",
);
expectSnippet(
  "file sign uses latest doc GET query params",
  "file",
  'businessRequest.get<unknown>("/file/sign",',
);
expectSnippet(
  "file compress requires fileId",
  "file",
  "export interface CompressImageParams {\n  fileId: string | number;",
);
expectSnippet(
  "file reference invalidate requires fileId and reason enum",
  "file",
  'reason: "message_withdraw" | "message_destroy";',
);
expectSnippet(
  "file resource detail uses latest doc GET",
  "file",
  'businessRequest.get<unknown>("/file/resources/detail",',
);
expectSnippet(
  "file delete passes fileId",
  "file",
  'businessRequest.post<unknown>("/file/delete", undefined,',
);
expectSnippet(
  "file reference status uses latest doc GET",
  "file",
  'businessRequest.get<unknown>("/file/reference/status",',
);
expectSnippet(
  "file download uses latest doc GET",
  "file",
  'businessRequest.get<Blob>("/file/download",',
);
expectSnippet(
  "file preview uses latest doc GET",
  "file",
  'businessRequest.get<Blob>("/file/preview",',
);
expectSnippet(
  "file resources list uses latest doc GET",
  "file",
  'businessRequest.get<unknown>("/file/resources",',
);
expectSnippet("file download returns blob", "file", 'responseType: "blob"');
expectSnippet(
  "file upload scene maps to api doc enum",
  "fileMessage",
  'type BusinessUploadScene = "common" | "image" | "room_share";',
);
expectSnippet(
  "file upload maps group file to room_share",
  "fileMessage",
  'scene === "image" ? "image" : groupID && roomId ? "room_share" : "common"',
);

expectSnippet("special role type is api doc enum subset", "group", "role: 3 | 4 | 5;");
expectSnippet(
  "join request action normalizes agree flag",
  "group",
  'action: normalizeGroupText(action ?? (agree ? "approve" : "reject")),',
);
expectSnippet(
  "notice update normalizes content to noticeContent",
  "group",
  "const normalizedNoticeContent = normalizeGroupText(noticeContent ?? content);",
);
expectSnippet(
  "group notice add uses latest doc endpoint",
  "group",
  'businessRequest.post<unknown>("/room/openim/notice/add", undefined,',
);
expectSnippet(
  "group detail wrapper uses roomId params",
  "group",
  'businessRequest.get<unknown>("/room/openim/detail",',
);
expectSnippet("group member list starts at api doc page 0", "group", "pageIndex: 0");
expectSnippet(
  "group member list uses latest doc GET",
  "group",
  'businessRequest.get<unknown>("/room/openim/members",',
);
expectSnippet(
  "group online members uses latest doc GET",
  "group",
  'businessRequest.get<unknown>("/room/openim/online-members",',
);
expectSnippet(
  "group special members uses latest doc GET",
  "group",
  'businessRequest.get<unknown>("/room/openim/special-members",',
);
expectSnippet(
  "group notice list uses latest doc GET",
  "group",
  'businessRequest.get<unknown>("/room/openim/notices",',
);
expectSnippet(
  "group read-detail uses latest doc GET",
  "group",
  'businessRequest.get<unknown>("/room/openim/message/read-detail",',
);
expectSnippet(
  "group join requests uses latest doc GET",
  "group",
  'businessRequest.get<unknown>("/room/openim/join-requests",',
);
expectSnippet(
  "group helper list uses latest doc GET",
  "group",
  'businessRequest.get<unknown>("/room/openim/group-helpers",',
);
expectSnippet(
  "group QR resolve uses latest doc GET",
  "group",
  'businessRequest.get<unknown>("/room/openim/qr/resolve",',
);
expectSnippet(
  "group member remark wrapper passes params",
  "group",
  '"/room/openim/member/remark/update",',
);
expectSnippet(
  "group no-push params require offlineNoPushMsg",
  "group",
  "export interface GroupOfflineNoPushParams extends GroupQueryParams {\n  offlineNoPushMsg: 0 | 1 | number;",
);
expectSnippet(
  "group top params require top",
  "group",
  "export interface GroupTopParams extends GroupQueryParams {\n  top: 0 | 1 | number;",
);
expectSnippet(
  "group no-push wrapper uses typed params",
  "group",
  "setOpenIMGroupOfflineNoPush = (params: GroupOfflineNoPushParams)",
);
expectSnippet(
  "group top wrapper uses typed params",
  "group",
  "setOpenIMGroupTop = (params: GroupTopParams)",
);
expectSnippet(
  "group notice UI requires existing notice id",
  "groupBusinessEntrances",
  'pickBusinessId(record, ["noticeId", "id"])',
);
expectSnippet(
  "group notice UI can add latest doc notice",
  "groupBusinessEntrances",
  "addOpenIMGroupNotice",
);
expectSnippet(
  "group setting writes allowSendCard business field",
  "groupSettings",
  "allowSendCard: toBinarySwitch(checked),",
);
expectSnippet(
  "group no-push passes offlineNoPushMsg",
  "groupSettings",
  "offlineNoPushMsg,",
);
expectSnippet("group pin passes top", "groupSettings", "top,");
expectSnippet(
  "group clear messages uses business clear-message before SDK clear",
  "groupSettings",
  "clearOpenIMGroupMessages({",
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
