import { randomUUID } from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const envFilePath = path.join(root, ".env");

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce((env, line) => {
      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) {
        return env;
      }

      const key = line.slice(0, separatorIndex).trim();
      const rawValue = line.slice(separatorIndex + 1).trim();
      env[key] = rawValue.replace(/^["']|["']$/g, "");
      return env;
    }, {});
};

const fileEnv = parseEnvFile(envFilePath);

const getEnv = (key, fallback = undefined) =>
  process.env[key] ?? fileEnv[key] ?? fallback;

const isEnabled = (key) => getEnv(key) === "1";

const businessApiURL = getEnv(
  "OPENIM_E2E_BUSINESS_API_URL",
  getEnv("VITE_BUSINESS_API_TARGET", "http://47.238.134.161:8092"),
);
const defaultEnterpriseCode = "LOCALTEST001";
const runRemote = isEnabled("OPENIM_E2E_RUN_REMOTE");
const runMutation = isEnabled("OPENIM_E2E_RUN_MUTATION");
const fetchFileBytes = isEnabled("OPENIM_E2E_FETCH_FILE_BYTES");

const controlEnv = [
  "OPENIM_E2E_BUSINESS_API_URL",
  "OPENIM_E2E_RUN_REMOTE",
  "OPENIM_E2E_RUN_MUTATION",
  "OPENIM_E2E_PLATFORM",
];

const requiredRemoteEnv = [
  "OPENIM_E2E_ACCOUNT1_PHONE",
  "OPENIM_E2E_ACCOUNT1_PASSWORD or OPENIM_E2E_ACCOUNT1_PASSWORD_MD5",
];

const uiEnv = [
  "OPENIM_E2E_RUN_UI",
  "OPENIM_E2E_WEB_URL",
  "OPENIM_E2E_ACCOUNT1_PHONE",
  "OPENIM_E2E_ACCOUNT1_PASSWORD",
  "OPENIM_E2E_ACCOUNT2_PHONE",
  "OPENIM_E2E_ACCOUNT2_PASSWORD",
  "OPENIM_E2E_FRIEND_SEARCH_KEYWORD",
  "OPENIM_E2E_FRIEND_SEARCH_EXPECTED_USER_ID",
];

const optionalRemoteEnv = [
  "OPENIM_E2E_ACCOUNT2_PHONE",
  "OPENIM_E2E_ACCOUNT2_PASSWORD or OPENIM_E2E_ACCOUNT2_PASSWORD_MD5",
  "OPENIM_E2E_FRIEND_SEARCH_KEYWORD",
  "OPENIM_E2E_FRIEND_SEARCH_EXPECTED_USER_ID",
  "OPENIM_E2E_USER_ACCOUNT_QUERY",
  "OPENIM_E2E_USER_ACCOUNT_EXPECTED_USER_ID",
  "OPENIM_E2E_FRIEND_USER_ID",
  "OPENIM_E2E_ROOM_ID",
  "OPENIM_E2E_MESSAGE_SEARCH_KEYWORD",
  "OPENIM_E2E_MESSAGE_AUDIT_IDS",
  "OPENIM_E2E_MESSAGE_MERGE_TITLE",
  "OPENIM_E2E_MESSAGE_FORWARD_TARGET_TYPE",
  "OPENIM_E2E_MESSAGE_FORWARD_TARGET_ID",
  "OPENIM_E2E_FAVORITE_ID",
  "OPENIM_E2E_MERGE_ID",
  "OPENIM_E2E_FILE_ID",
  "OPENIM_E2E_GROUP_MESSAGE_CLIENT_MSG_ID",
  "OPENIM_E2E_GROUP_MESSAGE_SERVER_MSG_ID",
  "OPENIM_E2E_GROUP_MESSAGE_SEQ",
];

const optionalMutationEnv = [
  "OPENIM_E2E_FETCH_FILE_BYTES",
  "OPENIM_E2E_UPLOAD_FILE_PATH",
  "OPENIM_E2E_UPLOAD_SCENE",
  "OPENIM_E2E_UPLOAD_ROOM_ID",
  "OPENIM_E2E_COMPRESS_UPLOADED_IMAGE",
  "OPENIM_E2E_CONVERT_UPLOADED_VIDEO",
  "OPENIM_E2E_GROUP_MUTATION_ROOM_ID",
  "OPENIM_E2E_GROUP_OFFLINE_NO_PUSH",
  "OPENIM_E2E_GROUP_TOP",
  "OPENIM_E2E_GROUP_REMARK_TARGET_USER_ID",
  "OPENIM_E2E_GROUP_REMARK_NAME",
  "OPENIM_E2E_GROUP_SPECIAL_USER_ID",
  "OPENIM_E2E_GROUP_SPECIAL_ROLE",
  "OPENIM_E2E_GROUP_NOTICE_ADD_CONTENT",
  "OPENIM_E2E_GROUP_NOTICE_ID",
  "OPENIM_E2E_GROUP_NOTICE_CONTENT",
  "OPENIM_E2E_GROUP_NOTICE_DELETE_ID",
  "OPENIM_E2E_GROUP_NOTICE_DELETE_AFTER_ADD",
  "OPENIM_E2E_GROUP_JOIN_REQUEST_ID",
  "OPENIM_E2E_GROUP_JOIN_ACTION",
  "OPENIM_E2E_GROUP_JOIN_REMARK",
  "OPENIM_E2E_GROUP_CLEAR_MESSAGE",
  "OPENIM_E2E_CONFIRM_CLEAR_MESSAGE",
];

const manualEvidence = [
  "Web login redirects from /login to the chat page. Run npm run verify:web-api-ui with OPENIM_E2E_RUN_UI=1.",
  "Saved accounts switch without mixing business token, OpenIM token, or userID. Run npm run verify:web-api-ui with OPENIM_E2E_ACCOUNT2_PHONE and OPENIM_E2E_ACCOUNT2_PASSWORD.",
  "Rejected friend/group send-before responses block SDK sendMessage and show backend text.",
  "File upload creates a business fileId, then preview/download renders through signed URLs or blobs. Run this script with OPENIM_E2E_RUN_MUTATION=1 and OPENIM_E2E_UPLOAD_FILE_PATH.",
  "Group notice/member remark/special role/mute/top/clear-message/join-request/read-detail/online-member entries work in the Web UI. This script can verify selected message, file, and group backend endpoints when matching env vars are set.",
];

const printPlan = () => {
  console.log("Web API e2e verification");
  console.log(`Business API: ${businessApiURL}`);
  console.log(`Enterprise code: ${defaultEnterpriseCode}`);
  console.log(`Remote requests enabled: ${runRemote ? "yes" : "no"}`);
  console.log(`Mutation requests enabled: ${runMutation ? "yes" : "no"}`);

  if (!runRemote) {
    console.log("");
    console.log(
      "No remote request was sent. Set OPENIM_E2E_RUN_REMOTE=1 to run read-only backend checks.",
    );
  } else if (!runMutation) {
    console.log("");
    console.log(
      "No mutation request will be sent. Set OPENIM_E2E_RUN_MUTATION=1 to run explicitly configured upload/group mutation checks.",
    );
  }

  console.log("");
  console.log("Control flags and optional overrides:");
  controlEnv.forEach((name) => console.log(`- ${name}`));

  console.log("");
  console.log("Required for remote login checks:");
  requiredRemoteEnv.forEach((name) => console.log(`- ${name}`));

  console.log("");
  console.log("Optional data for Web UI login and saved-account checks:");
  uiEnv.forEach((name) => console.log(`- ${name}`));

  console.log("");
  console.log("Optional data for broader read-only checks:");
  optionalRemoteEnv.forEach((name) => console.log(`- ${name}`));

  console.log("");
  console.log(
    "Optional data for mutation checks; also requires OPENIM_E2E_RUN_MUTATION=1:",
  );
  optionalMutationEnv.forEach((name) => console.log(`- ${name}`));

  console.log("");
  console.log("Manual/UI evidence still required:");
  manualEvidence.forEach((item) => console.log(`- ${item}`));
};

const collectMissingRemoteEnv = () => {
  const missing = [];

  if (!getEnv("OPENIM_E2E_ACCOUNT1_PHONE")) {
    missing.push("OPENIM_E2E_ACCOUNT1_PHONE");
  }
  if (
    !getEnv("OPENIM_E2E_ACCOUNT1_PASSWORD") &&
    !getEnv("OPENIM_E2E_ACCOUNT1_PASSWORD_MD5")
  ) {
    missing.push("OPENIM_E2E_ACCOUNT1_PASSWORD or OPENIM_E2E_ACCOUNT1_PASSWORD_MD5");
  }

  return missing;
};

const appendQuery = (target, params = {}) => {
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    target.searchParams.set(key, String(value));
  });
};

const appendBusinessAccessToken = (target, token) => {
  if (token && !target.searchParams.has("access_token")) {
    target.searchParams.set("access_token", token);
  }
};

const readResponse = (response, resolve) => {
  const chunks = [];
  response.on("data", (chunk) => chunks.push(chunk));
  response.on("end", () => {
    const buffer = Buffer.concat(chunks);
    const contentType = response.headers["content-type"] ?? "";
    const text = buffer.toString("utf8");
    let body = text;

    if (contentType.includes("application/json") && text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    resolve({
      statusCode: response.statusCode ?? 0,
      contentType,
      byteLength: buffer.byteLength,
      body,
    });
  });
};

const requestApi = (apiPath, options = {}) =>
  new Promise((resolve, reject) => {
    const target = new URL(apiPath, businessApiURL);
    appendQuery(target, options.params);
    appendBusinessAccessToken(target, options.token);

    const bodyText =
      options.body === undefined ? undefined : JSON.stringify(options.body);
    const headers = {
      operationID: randomUUID(),
      ...(options.token ? { token: options.token } : {}),
      ...(bodyText
        ? {
            "content-type": "application/json",
            "content-length": Buffer.byteLength(bodyText),
          }
        : {}),
    };

    const client = target.protocol === "https:" ? https : http;
    const request = client.request(
      target,
      {
        method: options.method ?? "POST",
        headers,
      },
      (response) => {
        readResponse(response, resolve);
      },
    );

    request.on("error", reject);

    if (bodyText) {
      request.write(bodyText);
    }
    request.end();
  });

const requestMultipartFile = (apiPath, options = {}) =>
  new Promise((resolve, reject) => {
    const filePath = path.resolve(root, options.filePath);
    const target = new URL(apiPath, businessApiURL);
    appendQuery(target, options.params);
    appendBusinessAccessToken(target, options.token);

    const boundary = `----openim-e2e-${randomUUID()}`;
    const fileName = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const bodyBuffer = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${
          options.fieldName ?? "file"
        }"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`,
      ),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const headers = {
      operationID: randomUUID(),
      ...(options.token ? { token: options.token } : {}),
      "content-type": `multipart/form-data; boundary=${boundary}`,
      "content-length": bodyBuffer.byteLength,
    };

    const client = target.protocol === "https:" ? https : http;
    const request = client.request(
      target,
      {
        method: "POST",
        headers,
      },
      (response) => {
        readResponse(response, resolve);
      },
    );

    request.on("error", reject);
    request.write(bodyBuffer);
    request.end();
  });

const requestURL = (url) =>
  new Promise((resolve, reject) => {
    const target = new URL(url, businessApiURL);
    const client = target.protocol === "https:" ? https : http;
    const request = client.request(
      target,
      {
        method: "GET",
        headers: {
          operationID: randomUUID(),
        },
      },
      (response) => {
        readResponse(response, resolve);
      },
    );

    request.on("error", reject);
    request.end();
  });

const readOnlyGetPaths = new Set([
  "/friend/openim/send-before",
  "/friend/openim/messages/search",
  "/room/openim/send-before",
  "/room/openim/messages/search",
  "/message/favorites",
  "/message/favorites/context",
  "/message/favorites/detail",
  "/message/merge/context",
  "/message/merge/preview",
  "/message/merge/forward-before",
  "/message/merge/saved",
  "/message/merge/detail",
  "/file/upload/context",
  "/file/sign",
  "/file/download",
  "/file/preview",
  "/file/resources",
  "/file/resources/detail",
  "/file/resources/references",
  "/file/storage/overview",
  "/file/storage/room-overview",
  "/file/reference/status",
  "/room/openim/detail",
  "/room/openim/members",
  "/room/openim/notices",
  "/room/openim/join-requests",
  "/room/openim/online-members",
  "/room/openim/special-members",
  "/room/openim/message/read-detail",
]);

const isRecord = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const unwrapBusinessPayload = (value) => {
  let current = value;
  const seen = new Set();

  while (isRecord(current) && !seen.has(current)) {
    seen.add(current);
    const wrapperKey = ["data", "result", "obj"].find(
      (key) => current[key] !== undefined && current[key] !== null,
    );
    if (!wrapperKey) {
      break;
    }
    current = current[wrapperKey];
  }

  return current;
};

const assertBusinessSuccess = (label, response) => {
  const getFailureDetail = () => {
    if (!isRecord(response.body)) {
      return "";
    }

    const message = pickText(response.body, [
      "errMsg",
      "resultMsg",
      "msg",
      "message",
      "error",
    ]);

    return message ? ` message=${message}` : "";
  };

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `${label} failed with HTTP ${response.statusCode}${getFailureDetail()}`,
    );
  }

  if (!isRecord(response.body)) {
    return response.body;
  }

  if ("errCode" in response.body && response.body.errCode !== 0) {
    throw new Error(
      `${label} failed with errCode=${response.body.errCode}${getFailureDetail()}`,
    );
  }

  if ("resultCode" in response.body && response.body.resultCode !== 1) {
    throw new Error(
      `${label} failed with resultCode=${
        response.body.resultCode
      }${getFailureDetail()}`,
    );
  }

  return response.body;
};

const pickText = (record, keys) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
    if (typeof value === "number") {
      return String(value);
    }
  }
  return undefined;
};

const hasFileLikeField = (record) =>
  [
    "fileId",
    "fileID",
    "file_id",
    "resourceId",
    "id",
    "url",
    "fileUrl",
    "previewUrl",
    "downloadUrl",
  ].some((key) => record[key] !== undefined && record[key] !== null);

const findFileRecord = (value, depth = 0) => {
  if (depth > 4) {
    return undefined;
  }

  const payload = unwrapBusinessPayload(value);
  if (Array.isArray(payload)) {
    return payload.map((item) => findFileRecord(item, depth + 1)).find((item) => item);
  }
  if (!isRecord(payload)) {
    return undefined;
  }
  if (hasFileLikeField(payload)) {
    return payload;
  }

  return ["file", "fileInfo", "resource", "resourceInfo", "detail", "item"]
    .map((key) => findFileRecord(payload[key], depth + 1))
    .find((item) => item);
};

const extractListItems = (body) => {
  const payload = unwrapBusinessPayload(body);

  if (Array.isArray(payload)) {
    return payload;
  }
  if (!isRecord(payload)) {
    return [];
  }

  for (const key of [
    "pageData",
    "list",
    "records",
    "items",
    "users",
    "friends",
    "dataList",
    "resultList",
    "helpers",
    "availableHelpers",
    "groupHelpers",
    "groupHelperList",
    "members",
    "onlineMembers",
    "specialMembers",
    "groups",
    "groupList",
    "rooms",
    "roomList",
    "groupInfos",
    "roomInfos",
    "notices",
    "joinRequests",
    "announcements",
    "shares",
    "resources",
    "favorites",
    "messages",
    "mergeMessages",
    "data",
  ]) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
};

const extractTotal = (body, fallbackItems) => {
  const payload = unwrapBusinessPayload(body);
  if (!isRecord(payload)) {
    return fallbackItems.length;
  }

  const total = pickText(payload, ["total", "pageDataCount", "count", "totalCount"]);

  return total ?? String(fallbackItems.length);
};

const findNoticeIdByContent = (body, noticeContent) => {
  const notice = extractListItems(body).find((item) => {
    if (!isRecord(item)) {
      return false;
    }
    const content = pickText(item, [
      "noticeContent",
      "content",
      "text",
      "notice",
      "message",
    ]);

    return content === noticeContent;
  });

  return notice ? pickText(notice, ["noticeId", "noticeID", "id"]) : undefined;
};

const normalizeUploadedFileId = (body) => {
  const record = findFileRecord(body);
  const fileId = record
    ? pickText(record, ["fileId", "fileID", "file_id", "resourceId", "id"])
    : undefined;

  if (!fileId) {
    throw new Error("File upload response does not contain fileId");
  }

  return fileId;
};

const normalizeLoginProfile = (body) => {
  const payload = unwrapBusinessPayload(body);
  const record = isRecord(payload) ? payload : {};
  const openIM = isRecord(record.openIM) ? record.openIM : {};
  const chatToken = pickText(record, [
    "chatToken",
    "access_token",
    "access_Token",
    "accessToken",
  ]);
  const imToken =
    pickText(record, ["imToken", "openIMToken"]) ?? pickText(openIM, ["token"]);
  const userID =
    pickText(record, ["userID", "userId"]) ?? pickText(openIM, ["userID", "userId"]);

  if (!chatToken || !imToken || !userID) {
    throw new Error("Login response does not contain chatToken, imToken, and userID");
  }

  return {
    chatToken,
    imToken,
    userID,
  };
};

const loginAccount = async (prefix) => {
  const areaCode = getEnv(`${prefix}_AREA_CODE`, "+86");
  const phoneNumber = getEnv(`${prefix}_PHONE`);
  const password = getEnv(`${prefix}_PASSWORD_MD5`) ?? getEnv(`${prefix}_PASSWORD`);
  const platform = Number(getEnv("OPENIM_E2E_PLATFORM", "5"));

  if (!phoneNumber || !password) {
    return undefined;
  }

  const response = await requestApi("/account/login", {
    body: {
      areaCode,
      enterpriseCode: defaultEnterpriseCode,
      invitationCode: defaultEnterpriseCode,
      phoneNumber,
      password,
      platform,
    },
  });
  const body = assertBusinessSuccess(`${prefix} login`, response);
  const profile = normalizeLoginProfile(body);
  console.log(`[pass] ${prefix} login userID=${profile.userID}`);
  return profile;
};

const assertDistinctAccountProfiles = (primary, secondary) => {
  ["userID", "chatToken", "imToken"].forEach((field) => {
    if (primary[field] === secondary[field]) {
      throw new Error(`Account1 and account2 resolved to the same ${field}`);
    }
  });

  console.log(
    "[pass] account profiles isolate business token, OpenIM token, and userID",
  );
};

const runReadCheck = async (label, apiPath, token, params = {}) => {
  const response = await requestApi(apiPath, {
    method: readOnlyGetPaths.has(apiPath) ? "GET" : "POST",
    params,
    token,
  });
  assertBusinessSuccess(label, response);
  console.log(`[pass] ${label}`);
  return response.body;
};

const runFriendSearchCheck = async (account) => {
  const keyword = getEnv("OPENIM_E2E_FRIEND_SEARCH_KEYWORD");
  if (!keyword) {
    console.log("[skip] friend target search; set OPENIM_E2E_FRIEND_SEARCH_KEYWORD");
    return;
  }

  const body = await runReadCheck(
    "friend target search",
    "/friends/page",
    account.chatToken,
    {
      userId: account.userID,
      keyword,
      pageIndex: 0,
      pageSize: 1,
    },
  );
  const items = extractListItems(body);
  const total = extractTotal(body, items);
  console.log(`[pass] friend target search keyword=${keyword} total=${total}`);

  const expectedUserId = getEnv("OPENIM_E2E_FRIEND_SEARCH_EXPECTED_USER_ID");
  if (!expectedUserId) {
    console.log(
      "[skip] friend target assertion; set OPENIM_E2E_FRIEND_SEARCH_EXPECTED_USER_ID",
    );
    return;
  }

  const matched = items.some((item) => {
    if (!isRecord(item)) {
      return false;
    }
    const userId = pickText(item, ["userID", "userId", "id"]);
    return userId === expectedUserId;
  });

  if (!matched) {
    throw new Error(
      `Friend target search did not return expected user ${expectedUserId}`,
    );
  }

  console.log(`[pass] friend target search returned expected userID=${expectedUserId}`);
};

const runUserAccountLookupCheck = async (account) => {
  const accountQuery = getEnv("OPENIM_E2E_USER_ACCOUNT_QUERY");
  if (!accountQuery) {
    console.log("[skip] user account lookup; set OPENIM_E2E_USER_ACCOUNT_QUERY");
    return;
  }

  const body = await runReadCheck(
    "user account lookup",
    "/user/getByAccount",
    account.chatToken,
    {
      account: accountQuery,
    },
  );
  const payload = unwrapBusinessPayload(body);
  const userId = isRecord(payload)
    ? pickText(payload, ["userID", "userId", "id"])
    : undefined;
  console.log(
    `[pass] user account lookup account=${accountQuery}${
      userId ? ` userID=${userId}` : ""
    }`,
  );

  const expectedUserId = getEnv("OPENIM_E2E_USER_ACCOUNT_EXPECTED_USER_ID");
  if (!expectedUserId) {
    console.log(
      "[skip] user account lookup assertion; set OPENIM_E2E_USER_ACCOUNT_EXPECTED_USER_ID",
    );
    return;
  }

  if (userId !== expectedUserId) {
    throw new Error(
      `User account lookup resolved userID=${
        userId ?? "<missing>"
      }; expected ${expectedUserId}`,
    );
  }

  console.log(`[pass] user account lookup returned expected userID=${expectedUserId}`);
};

const assertSignedFile = (body, fallbackFileId) => {
  const payload = unwrapBusinessPayload(body);

  if (typeof payload === "string" && payload.length > 0) {
    return {
      url: payload,
    };
  }

  const record = isRecord(payload) ? payload : {};
  const fileId =
    pickText(record, ["fileId", "fileID", "file_id", "id"]) ?? fallbackFileId;
  const expiresAt = pickText(record, ["expiresAt", "expireAt", "expires"]);
  const signature = pickText(record, ["signature", "sign"]);

  if (!fileId || !expiresAt || !signature) {
    throw new Error(
      "File sign response does not contain url or fileId/expiresAt/signature",
    );
  }

  return {
    fileId,
    expiresAt,
    signature,
  };
};

const assertHTTPBytesSuccess = (label, response) => {
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`${label} failed with HTTP ${response.statusCode}`);
  }
  if (response.byteLength <= 0) {
    throw new Error(`${label} returned empty response`);
  }
};

const runSignedFileChecks = async (token, fileId, label) => {
  for (const mode of ["preview", "download"]) {
    const signBody = await runReadCheck(
      `file sign ${mode} (${label})`,
      "/file/sign",
      token,
      {
        fileId,
        mode,
      },
    );
    const signedFile = assertSignedFile(signBody, fileId);
    console.log(
      `[pass] file sign ${mode} (${label}) contains usable url or signature fields`,
    );

    if (!fetchFileBytes) {
      console.log(
        `[skip] file ${mode} bytes (${label}); set OPENIM_E2E_FETCH_FILE_BYTES=1`,
      );
      continue;
    }

    if (signedFile.url) {
      const fileResponse = await requestURL(signedFile.url);
      assertHTTPBytesSuccess(`file ${mode} url bytes (${label})`, fileResponse);
      console.log(
        `[pass] file ${mode} url bytes (${label}) bytes=${fileResponse.byteLength}`,
      );
      continue;
    }

    const fileResponse = await requestApi(`/file/${mode}`, {
      params: {
        fileId: signedFile.fileId,
        expiresAt: signedFile.expiresAt,
        signature: signedFile.signature,
        mode,
      },
      token,
    });
    assertHTTPBytesSuccess(`file ${mode} bytes (${label})`, fileResponse);
    console.log(
      `[pass] file ${mode} bytes (${label}) bytes=${fileResponse.byteLength}`,
    );
  }
};

const runMessageReadChecks = async (account, options = {}) => {
  const pageParams = {
    pageIndex: 0,
    pageSize: 20,
  };
  const keyword = getEnv("OPENIM_E2E_MESSAGE_SEARCH_KEYWORD");

  if (options.friendUserId) {
    await runReadCheck(
      "single message search",
      "/friend/openim/messages/search",
      account.chatToken,
      {
        peerUserId: options.friendUserId,
        keyword,
        ...pageParams,
      },
    );
  } else {
    console.log("[skip] single message search; set OPENIM_E2E_FRIEND_USER_ID");
  }

  if (options.roomId) {
    await runReadCheck(
      "group message search",
      "/room/openim/messages/search",
      account.chatToken,
      {
        roomId: options.roomId,
        keyword,
        ...pageParams,
      },
    );
  } else {
    console.log("[skip] group message search; set OPENIM_E2E_ROOM_ID");
  }

  await runReadCheck(
    "message favorites list",
    "/message/favorites",
    account.chatToken,
    {
      deleted: 0,
      ...pageParams,
    },
  );

  const favoriteId = getEnv("OPENIM_E2E_FAVORITE_ID");
  if (favoriteId) {
    await runReadCheck(
      "message favorite detail",
      "/message/favorites/detail",
      account.chatToken,
      {
        favoriteId,
      },
    );
  } else {
    console.log("[skip] message favorite detail; set OPENIM_E2E_FAVORITE_ID");
  }

  await runReadCheck(
    "saved merge messages",
    "/message/merge/saved",
    account.chatToken,
    {
      deleted: 0,
      ...pageParams,
    },
  );

  const mergeId = getEnv("OPENIM_E2E_MERGE_ID");
  if (mergeId) {
    await runReadCheck(
      "merge message detail",
      "/message/merge/detail",
      account.chatToken,
      {
        mergeId,
      },
    );
  } else {
    console.log("[skip] merge message detail; set OPENIM_E2E_MERGE_ID");
  }

  const auditIds = getEnv("OPENIM_E2E_MESSAGE_AUDIT_IDS");
  if (!auditIds) {
    console.log(
      "[skip] merge preview and forward-before; set OPENIM_E2E_MESSAGE_AUDIT_IDS",
    );
    return;
  }

  const title = getEnv("OPENIM_E2E_MESSAGE_MERGE_TITLE", "e2e-check");
  await runReadCheck(
    "merge message preview",
    "/message/merge/preview",
    account.chatToken,
    {
      auditIds,
      title,
    },
  );

  const targetType = getEnv("OPENIM_E2E_MESSAGE_FORWARD_TARGET_TYPE");
  const targetId = getEnv("OPENIM_E2E_MESSAGE_FORWARD_TARGET_ID");
  if (!targetType || !targetId) {
    console.log(
      "[skip] merge forward-before; set OPENIM_E2E_MESSAGE_FORWARD_TARGET_TYPE and OPENIM_E2E_MESSAGE_FORWARD_TARGET_ID",
    );
    return;
  }

  await runReadCheck(
    "merge message forward-before",
    "/message/merge/forward-before",
    account.chatToken,
    {
      auditIds,
      title,
      targetType,
      targetId,
    },
  );
};

const runFileUploadMutation = async (account, roomId) => {
  const uploadFilePath = getEnv("OPENIM_E2E_UPLOAD_FILE_PATH");
  if (!runMutation || !uploadFilePath) {
    console.log(
      "[skip] file upload mutation; set OPENIM_E2E_RUN_MUTATION=1 and OPENIM_E2E_UPLOAD_FILE_PATH",
    );
    return;
  }

  const resolvedFilePath = path.resolve(root, uploadFilePath);
  if (!fs.existsSync(resolvedFilePath)) {
    throw new Error(`Upload file does not exist: ${resolvedFilePath}`);
  }

  const scene = getEnv("OPENIM_E2E_UPLOAD_SCENE", roomId ? "room_share" : "common");
  const uploadRoomId = getEnv(
    "OPENIM_E2E_UPLOAD_ROOM_ID",
    scene === "room_share" ? roomId : undefined,
  );
  const params = {
    scene,
    roomId: uploadRoomId,
  };

  await runReadCheck(
    "file upload context",
    "/file/upload/context",
    account.chatToken,
    params,
  );
  const uploadResponse = await requestMultipartFile("/file/upload", {
    filePath: resolvedFilePath,
    params,
    token: account.chatToken,
  });
  const uploadBody = assertBusinessSuccess("file upload", uploadResponse);
  const uploadedFileId = normalizeUploadedFileId(uploadBody);
  console.log(`[pass] file upload fileId=${uploadedFileId}`);

  if (isEnabled("OPENIM_E2E_COMPRESS_UPLOADED_IMAGE")) {
    await runReadCheck("uploaded image compress", "/file/compress", account.chatToken, {
      fileId: uploadedFileId,
    });
  }

  if (isEnabled("OPENIM_E2E_CONVERT_UPLOADED_VIDEO")) {
    await runReadCheck("uploaded video convert", "/file/convert", account.chatToken, {
      fileId: uploadedFileId,
    });
  }

  await runSignedFileChecks(account.chatToken, uploadedFileId, "uploaded");
};

const runGroupMutationChecks = async (account, fallbackRoomId) => {
  if (!runMutation) {
    console.log("[skip] group mutation checks; set OPENIM_E2E_RUN_MUTATION=1");
    return;
  }

  const roomId = getEnv("OPENIM_E2E_GROUP_MUTATION_ROOM_ID", fallbackRoomId);
  if (!roomId) {
    console.log(
      "[skip] group mutation checks; set OPENIM_E2E_GROUP_MUTATION_ROOM_ID or OPENIM_E2E_ROOM_ID",
    );
    return;
  }

  let executed = 0;
  const runMutationCheck = async (label, apiPath, params) => {
    executed += 1;
    return runReadCheck(label, apiPath, account.chatToken, params);
  };

  const offlineNoPush = getEnv("OPENIM_E2E_GROUP_OFFLINE_NO_PUSH");
  if (offlineNoPush !== undefined) {
    await runMutationCheck(
      "group set offline no push",
      "/room/openim/member/set-offline-no-push",
      {
        roomId,
        offlineNoPushMsg: offlineNoPush,
      },
    );
  }

  const top = getEnv("OPENIM_E2E_GROUP_TOP");
  if (top !== undefined) {
    await runMutationCheck("group set top", "/room/openim/member/set-top", {
      roomId,
      top,
    });
  }

  const remarkTargetUserId = getEnv("OPENIM_E2E_GROUP_REMARK_TARGET_USER_ID");
  const remarkName = getEnv("OPENIM_E2E_GROUP_REMARK_NAME");
  if (remarkTargetUserId && remarkName !== undefined) {
    await runMutationCheck(
      "group member remark update",
      "/room/openim/member/remark/update",
      {
        roomId,
        targetUserId: remarkTargetUserId,
        remarkName,
      },
    );
  }

  const specialUserId = getEnv("OPENIM_E2E_GROUP_SPECIAL_USER_ID");
  const specialRole = getEnv("OPENIM_E2E_GROUP_SPECIAL_ROLE");
  if (specialUserId && specialRole) {
    await runMutationCheck(
      "group special role update",
      "/room/openim/member/set-special-role",
      {
        roomId,
        userId: specialUserId,
        role: specialRole,
      },
    );
  }

  let createdNoticeId;
  const noticeAddContent = getEnv("OPENIM_E2E_GROUP_NOTICE_ADD_CONTENT");
  if (noticeAddContent) {
    await runMutationCheck("group notice add", "/room/openim/notice/add", {
      roomId,
      noticeContent: noticeAddContent,
    });
    const noticesAfterAdd = await runReadCheck(
      "group notices after add",
      "/room/openim/notices",
      account.chatToken,
      {
        roomId,
        pageIndex: 0,
        pageSize: 50,
      },
    );
    createdNoticeId = findNoticeIdByContent(noticesAfterAdd, noticeAddContent);

    if (!createdNoticeId) {
      throw new Error("Group notice add succeeded but noticeId was not found");
    }
    console.log(`[pass] group notice add found noticeId=${createdNoticeId}`);
  }

  const noticeId = getEnv("OPENIM_E2E_GROUP_NOTICE_ID", createdNoticeId);
  const noticeContent = getEnv("OPENIM_E2E_GROUP_NOTICE_CONTENT");
  if (noticeId && noticeContent) {
    await runMutationCheck("group notice update", "/room/openim/notice/update", {
      roomId,
      noticeId,
      noticeContent,
    });
  }

  const noticeDeleteId = getEnv(
    "OPENIM_E2E_GROUP_NOTICE_DELETE_ID",
    isEnabled("OPENIM_E2E_GROUP_NOTICE_DELETE_AFTER_ADD") ? createdNoticeId : undefined,
  );
  if (noticeDeleteId) {
    await runMutationCheck("group notice delete", "/room/openim/notice/delete", {
      roomId,
      noticeId: noticeDeleteId,
    });
  }

  const joinRequestId = getEnv("OPENIM_E2E_GROUP_JOIN_REQUEST_ID");
  const joinAction = getEnv("OPENIM_E2E_GROUP_JOIN_ACTION");
  if (joinRequestId && joinAction) {
    await runMutationCheck(
      "group join request handle",
      "/room/openim/join-requests/handle",
      {
        requestId: joinRequestId,
        action: joinAction,
        remark: getEnv("OPENIM_E2E_GROUP_JOIN_REMARK"),
      },
    );
  }

  if (isEnabled("OPENIM_E2E_GROUP_CLEAR_MESSAGE")) {
    if (!isEnabled("OPENIM_E2E_CONFIRM_CLEAR_MESSAGE")) {
      throw new Error(
        "Set OPENIM_E2E_CONFIRM_CLEAR_MESSAGE=1 to confirm clear-message mutation",
      );
    }
    await runMutationCheck(
      "group clear message cursor",
      "/room/openim/member/clear-message",
      {
        roomId,
      },
    );
  }

  if (executed === 0) {
    console.log("[skip] group mutation checks; no group mutation env vars were set");
  }
};

const runRemoteChecks = async () => {
  const missing = collectMissingRemoteEnv();
  if (missing.length > 0) {
    console.error("Missing env for remote checks:");
    missing.forEach((name) => console.error(`- ${name}`));
    process.exitCode = 1;
    return;
  }

  const account1 = await loginAccount("OPENIM_E2E_ACCOUNT1");
  if (!account1) {
    throw new Error("Account1 login was not configured");
  }

  const account2 = await loginAccount("OPENIM_E2E_ACCOUNT2");
  if (account2) {
    assertDistinctAccountProfiles(account1, account2);
    await runReadCheck("account2 friends list", "/friends/list", account2.chatToken, {
      userId: account2.userID,
    });
  } else {
    console.log(
      "[skip] account2 login; set OPENIM_E2E_ACCOUNT2_* to check multi-account token isolation",
    );
  }

  await runReadCheck("friends list", "/friends/list", account1.chatToken, {
    userId: account1.userID,
  });
  await runFriendSearchCheck(account1);
  await runUserAccountLookupCheck(account1);

  const friendUserId = getEnv("OPENIM_E2E_FRIEND_USER_ID");
  if (friendUserId) {
    await runReadCheck("friend detail", "/friends/get", account1.chatToken, {
      userId: account1.userID,
      toUserId: friendUserId,
    });
    await runReadCheck(
      "friend send-before",
      "/friend/openim/send-before",
      account1.chatToken,
      {
        toUserId: friendUserId,
      },
    );
  } else {
    console.log("[skip] friend checks; set OPENIM_E2E_FRIEND_USER_ID");
  }

  const roomId = getEnv("OPENIM_E2E_ROOM_ID");
  if (roomId) {
    await runReadCheck("group detail", "/room/openim/detail", account1.chatToken, {
      roomId,
    });
    await runReadCheck("group members", "/room/openim/members", account1.chatToken, {
      roomId,
      pageIndex: 0,
      pageSize: 20,
    });
    await runReadCheck("group notices", "/room/openim/notices", account1.chatToken, {
      roomId,
      pageIndex: 0,
      pageSize: 20,
    });
    await runReadCheck(
      "group join requests",
      "/room/openim/join-requests",
      account1.chatToken,
      {
        roomId,
        pageIndex: 0,
        pageSize: 20,
      },
    );
    await runReadCheck(
      "group online members",
      "/room/openim/online-members",
      account1.chatToken,
      {
        roomId,
        pageIndex: 0,
        pageSize: 20,
      },
    );
    await runReadCheck(
      "group special members",
      "/room/openim/special-members",
      account1.chatToken,
      {
        roomId,
        pageIndex: 0,
        pageSize: 20,
      },
    );
    await runReadCheck(
      "group send-before",
      "/room/openim/send-before",
      account1.chatToken,
      {
        roomId,
        messageType: "text",
        contentText: "e2e-check",
      },
    );
    await runReadCheck(
      "group read detail capability",
      "/room/openim/message/read-detail",
      account1.chatToken,
      {
        roomId,
        clientMsgID: getEnv("OPENIM_E2E_GROUP_MESSAGE_CLIENT_MSG_ID"),
        serverMsgID: getEnv("OPENIM_E2E_GROUP_MESSAGE_SERVER_MSG_ID"),
        seq: getEnv("OPENIM_E2E_GROUP_MESSAGE_SEQ"),
      },
    );
  } else {
    console.log("[skip] group checks; set OPENIM_E2E_ROOM_ID");
  }

  await runMessageReadChecks(account1, {
    friendUserId,
    roomId,
  });

  await runGroupMutationChecks(account1, roomId);

  const fileId = getEnv("OPENIM_E2E_FILE_ID");
  if (fileId) {
    await runReadCheck("file resources", "/file/resources", account1.chatToken, {
      pageIndex: 0,
      pageSize: 20,
    });
    await runReadCheck(
      "file resource detail",
      "/file/resources/detail",
      account1.chatToken,
      {
        fileId,
      },
    );
    await runReadCheck(
      "file reference status",
      "/file/reference/status",
      account1.chatToken,
      {
        fileId,
      },
    );
    await runSignedFileChecks(account1.chatToken, fileId, "existing");
  } else {
    console.log("[skip] file checks; set OPENIM_E2E_FILE_ID");
  }

  await runFileUploadMutation(account1, roomId);
};

printPlan();

if (runRemote) {
  await runRemoteChecks();
}
