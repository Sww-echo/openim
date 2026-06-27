import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const apiDocPath = path.join(root, "docs", "openim-frontend-api-doc.json");
const apiDir = path.join(root, "src", "api");
const viteConfigPaths = [
  "vite.config.ts",
  "vite.legacy.config.ts",
  "vite.web.config.ts",
];

const expectedWebApiPaths = [
  "/account/code/send",
  "/account/code/verify",
  "/account/login",
  "/account/register",
  "/enterprise/code/validate",
  "/friend/openim/messages/search",
  "/friend/openim/send-before",
  "/friends/add",
  "/friends/blacklist/add",
  "/friends/blacklist/delete",
  "/friends/delete",
  "/friends/get",
  "/friends/list",
  "/friends/newFriendListWeb",
  "/friends/page",
  "/friends/queryBlacklistWeb",
  "/friends/remark",
  "/friends/update",
  "/friends/update/OfflineNoPushMsg",
  "/file/compress",
  "/file/compress/async",
  "/file/convert",
  "/file/convert/async",
  "/file/delete",
  "/file/download",
  "/file/preview",
  "/file/reference/invalidate",
  "/file/reference/status",
  "/file/resources",
  "/file/resources/detail",
  "/file/resources/references",
  "/file/sign",
  "/file/storage/overview",
  "/file/storage/room-overview",
  "/file/thumbnail",
  "/file/upload",
  "/file/upload/context",
  "/message/favorites",
  "/message/favorites/add",
  "/message/favorites/context",
  "/message/favorites/delete",
  "/message/favorites/detail",
  "/message/favorites/merge",
  "/message/favorites/update",
  "/message/merge/context",
  "/message/merge/delete",
  "/message/merge/detail",
  "/message/merge/forward-before",
  "/message/merge/preview",
  "/message/merge/save",
  "/message/merge/saved",
  "/room/add",
  "/room/openim/detail",
  "/room/openim/group-helpers",
  "/room/openim/group-helpers/add",
  "/room/openim/group-helpers/available",
  "/room/openim/group-helpers/context",
  "/room/openim/group-helpers/delete",
  "/room/openim/group-helpers/keywords/add",
  "/room/openim/group-helpers/keywords/delete",
  "/room/openim/group-helpers/keywords/update",
  "/room/openim/join-requests",
  "/room/openim/join-requests/handle",
  "/room/openim/member/clear-message",
  "/room/openim/member/detail",
  "/room/openim/member/remark/update",
  "/room/openim/member/set-offline-no-push",
  "/room/openim/member/set-special-role",
  "/room/openim/member/set-top",
  "/room/openim/members",
  "/room/openim/message/read-detail",
  "/room/openim/message/recall",
  "/room/openim/messages/search",
  "/room/openim/notice/add",
  "/room/openim/notice/delete",
  "/room/openim/notice/update",
  "/room/openim/notices",
  "/room/openim/online-members",
  "/room/openim/qr/create",
  "/room/openim/qr/join",
  "/room/openim/qr/resolve",
  "/room/openim/send-before",
  "/room/openim/share/add",
  "/room/openim/share/delete",
  "/room/openim/share/detail",
  "/room/openim/shares",
  "/room/openim/special-members",
  "/system/announcements",
  "/system/announcements/detail",
  "/system/announcements/read",
  "/system/announcements/read-all",
  "/system/announcements/unread-count",
  "/user/avatar/get",
  "/user/get",
  "/user/getByAccount",
  "/user/notification/settings",
  "/user/notification/settings/defaults",
  "/user/notification/settings/update",
  "/user/openim/token",
  "/user/public/search/list",
  "/user/update",
];

const excludedPrefixes = [
  "/alipay/",
  "/b/",
  "/console/",
  "/consumeRecord/",
  "/CustomerService/",
  "/liveRoom/",
  "/onlineAward/",
  "/pay/",
  "/skTransfer/",
  "/transfer/",
  "/user/buyOrder/",
  "/user/goods/",
  "/zhuanpan/",
];

const allowedSourceOnlyPaths = [
  "/friends/blacklist",
  "/friends/newFriend/last",
  "/friends/newFriend/list",
  "/user/offlineOperation",
  "/user/profile/metas",
  "/user/profile/update",
  "/user/rtc/get_token",
];

const allowedSourceNotInApiDocPaths = [
  "/friends/modify/phoneRemark",
  "/friends/update",
  "/user/checkReportUrl",
  "/user/get/v1",
  "/user/getBindInfo",
  "/user/getOnLine",
  "/user/getUserInfo",
  "/user/public/search/list",
  "/user/report",
  "/user/settings",
  "/user/settings/update",
  "/user/update",
  "/user/update/OfflineNoPushMsg",
];

const readApiSource = (dir) =>
  fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"))
    .map((file) => fs.readFileSync(path.join(dir, file), "utf8"))
    .join("\n");

const extractApiPaths = (source) => {
  const matches = source.matchAll(/["'`]((?:\/[A-Za-z0-9][^"'`\s),}]*)+)["'`]/g);
  return [...new Set([...matches].map((match) => match[1]))].sort();
};

const apiDoc = JSON.parse(fs.readFileSync(apiDocPath, "utf8"));
const apiDocPaths = new Set(
  (apiDoc.operations ?? []).map((operation) => operation.path).filter(Boolean),
);
const sourcePaths = extractApiPaths(readApiSource(apiDir));
const sourcePathSet = new Set(sourcePaths);

const missingInApiDoc = expectedWebApiPaths.filter(
  (apiPath) =>
    !apiDocPaths.has(apiPath) && !allowedSourceNotInApiDocPaths.includes(apiPath),
);
const missingInSource = expectedWebApiPaths.filter(
  (apiPath) => !sourcePathSet.has(apiPath),
);
const excludedInSource = sourcePaths.filter((apiPath) =>
  excludedPrefixes.some((prefix) => apiPath.startsWith(prefix)),
);
const sourceOnly = sourcePaths.filter(
  (apiPath) =>
    apiDocPaths.has(apiPath) &&
    !expectedWebApiPaths.includes(apiPath) &&
    !excludedPrefixes.some((prefix) => apiPath.startsWith(prefix)),
);
const sourceNotInApiDoc = sourcePaths.filter(
  (apiPath) =>
    !apiDocPaths.has(apiPath) &&
    !excludedPrefixes.some((prefix) => apiPath.startsWith(prefix)),
);
const unexpectedSourceOnly = sourceOnly.filter(
  (apiPath) => !allowedSourceOnlyPaths.includes(apiPath),
);
const unexpectedSourceNotInApiDoc = sourceNotInApiDoc.filter(
  (apiPath) => !allowedSourceNotInApiDocPaths.includes(apiPath),
);
const missingProxyConfigs = viteConfigPaths.filter((configPath) => {
  const content = fs.readFileSync(path.join(root, configPath), "utf8");
  return !content.includes("createBusinessApiProxy");
});

const errors = [
  ["missingInApiDoc", missingInApiDoc],
  ["missingInSource", missingInSource],
  ["excludedInSource", excludedInSource],
  ["unexpectedSourceOnly", unexpectedSourceOnly],
  ["unexpectedSourceNotInApiDoc", unexpectedSourceNotInApiDoc],
  ["missingProxyConfigs", missingProxyConfigs],
].filter(([, items]) => items.length > 0);

console.log(
  JSON.stringify(
    {
      expectedCount: expectedWebApiPaths.length,
      sourcePathCount: sourcePaths.length,
      sourceOnly,
      unexpectedSourceOnly,
      missingInApiDoc,
      missingInSource,
      excludedInSource,
      sourceNotInApiDoc,
      unexpectedSourceNotInApiDoc,
      missingProxyConfigs,
    },
    null,
    2,
  ),
);

if (errors.length > 0) {
  process.exitCode = 1;
}
