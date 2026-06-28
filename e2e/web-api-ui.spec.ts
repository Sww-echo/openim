import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const runUI = process.env.OPENIM_E2E_RUN_UI === "1";
const webURL =
  process.env.OPENIM_E2E_WEB_URL ?? "http://127.0.0.1:7777/index.html#/login";
const phoneNumber = process.env.OPENIM_E2E_ACCOUNT1_PHONE;
const password = process.env.OPENIM_E2E_ACCOUNT1_PASSWORD;
const account2PhoneNumber = process.env.OPENIM_E2E_ACCOUNT2_PHONE;
const account2Password = process.env.OPENIM_E2E_ACCOUNT2_PASSWORD;
const friendSearchKeyword = process.env.OPENIM_E2E_FRIEND_SEARCH_KEYWORD;
const expectedFriendSearchUserId =
  process.env.OPENIM_E2E_FRIEND_SEARCH_EXPECTED_USER_ID;
const enterpriseCode = "LOCALTEST001";

const missingEnv = [
  ["OPENIM_E2E_ACCOUNT1_PHONE", phoneNumber],
  ["OPENIM_E2E_ACCOUNT1_PASSWORD", password],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

type LoginCredentials = {
  phoneNumber?: string;
  password?: string;
};

const pickText = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value) {
      return value;
    }
    if (typeof value === "number") {
      return String(value);
    }
  }
  return undefined;
};

const unwrapBusinessPayload = (value: unknown) => {
  if (!isRecord(value)) {
    return undefined;
  }
  return value.data ?? value.result ?? value.obj ?? value;
};

const normalizeLoginProfile = (body: unknown) => {
  const payload = unwrapBusinessPayload(body);
  const record = isRecord(payload) ? payload : {};
  const openIM = isRecord(record.openIM) ? record.openIM : {};
  const chatToken = pickText(record, ["chatToken", "access_token"]);
  const imToken =
    pickText(record, ["imToken", "openIMToken"]) ?? pickText(openIM, ["token"]);
  const userID =
    pickText(record, ["userID", "userId"]) ?? pickText(openIM, ["userID", "userId"]);

  return chatToken && imToken && userID ? { chatToken, imToken, userID } : undefined;
};

const extractListItems = (body: unknown): unknown[] => {
  const payload = unwrapBusinessPayload(body);

  if (Array.isArray(payload)) {
    return payload as unknown[];
  }
  if (!isRecord(payload)) {
    return [];
  }

  if (pickText(payload, ["userID", "userId", "id"])) {
    return [payload];
  }

  for (const key of ["pageData", "list", "records", "items", "data"]) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value as unknown[];
    }
  }

  return [];
};

const extractTotal = (body: unknown, items: unknown[]) => {
  const payload = unwrapBusinessPayload(body);

  if (!isRecord(payload)) {
    return items.length;
  }

  const total = payload.total ?? payload.count;
  return typeof total === "number" ? total : items.length;
};

const readLocalForageItem = async (page: Page, key: string) =>
  page.evaluate(
    async (storeKey) =>
      new Promise<unknown>((resolve, reject) => {
        const request = indexedDB.open("OpenCorp-Config");

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;

          if (!db.objectStoreNames.contains("keyvaluepairs")) {
            db.close();
            resolve(undefined);
            return;
          }

          const transaction = db.transaction("keyvaluepairs", "readonly");
          const store = transaction.objectStore("keyvaluepairs");
          const getRequest = store.get(storeKey);

          getRequest.onerror = () => {
            db.close();
            reject(getRequest.error);
          };
          getRequest.onsuccess = () => {
            const result = getRequest.result;
            db.close();
            resolve(
              result && typeof result === "object" && "value" in result
                ? (result as { value: unknown }).value
                : result,
            );
          };
        };
      }),
    key,
  );

const removeLocalForageItems = async (page: Page, keys: string[]) =>
  page.evaluate(
    async (storeKeys) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("OpenCorp-Config");

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;

          if (!db.objectStoreNames.contains("keyvaluepairs")) {
            db.close();
            resolve();
            return;
          }

          const transaction = db.transaction("keyvaluepairs", "readwrite");
          const store = transaction.objectStore("keyvaluepairs");

          storeKeys.forEach((key) => store.delete(key));

          transaction.onerror = () => {
            db.close();
            reject(transaction.error);
          };
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
        };
      }),
    keys,
  );

const readStoredLoginState = async (
  page: Page,
  expectedProfile?: { chatToken: string; imToken: string; userID: string },
) => {
  const savedAccounts = await readLocalForageItem(page, "IM_WEB_SAVED_ACCOUNTS");
  const savedAccount = Array.isArray(savedAccounts)
    ? savedAccounts.find((account) => {
        if (!isRecord(account) || !("accountKey" in account)) {
          return false;
        }
        return account.accountKey === expectedProfile?.userID;
      })
    : undefined;

  return {
    chatToken: await readLocalForageItem(page, "IM_CHAT_TOKEN"),
    currentAccountKey: await readLocalForageItem(page, "IM_WEB_CURRENT_ACCOUNT"),
    imToken: await readLocalForageItem(page, "IM_TOKEN"),
    savedAccountCount: Array.isArray(savedAccounts) ? savedAccounts.length : 0,
    savedChatToken: isRecord(savedAccount) ? savedAccount.chatToken : undefined,
    savedImToken: isRecord(savedAccount) ? savedAccount.imToken : undefined,
    savedUserID: isRecord(savedAccount) ? savedAccount.userID : undefined,
    userID: await readLocalForageItem(page, "IM_USERID"),
  };
};

const clearCurrentLoginState = async (page: Page) => {
  await removeLocalForageItems(page, [
    "IM_CHAT_TOKEN",
    "IM_TOKEN",
    "IM_USERID",
    "IM_WEB_CURRENT_ACCOUNT",
  ]);
};

const loginAndExpectChat = async (
  page: Page,
  credentials: LoginCredentials = { phoneNumber, password },
) => {
  await page.goto(webURL);

  await page.locator("input#phoneNumber").fill(credentials.phoneNumber ?? "");
  await page.locator("input#password").fill(credentials.password ?? "");

  await expect(page.locator("input#invitationCode")).toHaveValue(enterpriseCode);
  await expect(page.locator("input#invitationCode")).toBeDisabled();

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes("/account/login"),
    {
      timeout: 30000,
    },
  );

  await page.locator('button[type="submit"]').click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.ok()).toBeTruthy();

  const loginBody = await loginResponse.json().catch(() => undefined);
  const expectedProfile = normalizeLoginProfile(loginBody);
  expect(expectedProfile).toBeDefined();

  if (isRecord(loginBody)) {
    if ("errCode" in loginBody) {
      expect(loginBody.errCode).toBe(0);
    }
    if ("resultCode" in loginBody) {
      expect(loginBody.resultCode).toBe(1);
    }
  }

  await expect(page).toHaveURL(/#\/chat/, {
    timeout: 45000,
  });

  return expectedProfile;
};

test.describe("Web business API UI e2e", () => {
  test.skip(!runUI, "Set OPENIM_E2E_RUN_UI=1 to run Web UI remote checks.");
  test.skip(
    missingEnv.length > 0,
    `Missing env for Web UI remote checks: ${missingEnv.join(", ")}`,
  );

  test("login redirects to chat after business login succeeds", async ({ page }) => {
    const expectedProfile = await loginAndExpectChat(page);

    await expect
      .poll(async () => readStoredLoginState(page, expectedProfile), {
        timeout: 15000,
      })
      .toEqual({
        chatToken: expectedProfile?.chatToken,
        currentAccountKey: expectedProfile?.userID,
        imToken: expectedProfile?.imToken,
        savedAccountCount: expect.any(Number),
        savedChatToken: expectedProfile?.chatToken,
        savedImToken: expectedProfile?.imToken,
        savedUserID: expectedProfile?.userID,
        userID: expectedProfile?.userID,
      });
  });

  test("switching saved accounts rewrites tokens and user id", async ({ page }) => {
    test.skip(
      !account2PhoneNumber || !account2Password,
      "Set OPENIM_E2E_ACCOUNT2_PHONE and OPENIM_E2E_ACCOUNT2_PASSWORD to run saved-account switch UI check.",
    );

    const account1Profile = await loginAndExpectChat(page);
    await clearCurrentLoginState(page);

    const account2Profile = await loginAndExpectChat(page, {
      password: account2Password,
      phoneNumber: account2PhoneNumber,
    });

    expect(account2Profile?.userID).not.toBe(account1Profile?.userID);
    expect(account2Profile?.chatToken).not.toBe(account1Profile?.chatToken);
    expect(account2Profile?.imToken).not.toBe(account1Profile?.imToken);

    await expect
      .poll(async () => readStoredLoginState(page, account1Profile), {
        timeout: 15000,
      })
      .toMatchObject({
        savedChatToken: account1Profile?.chatToken,
        savedImToken: account1Profile?.imToken,
        savedUserID: account1Profile?.userID,
      });

    await page.getByTestId("profile-menu-trigger").click();

    const account1Switch = page.locator(
      `[data-testid="saved-account-switch"][data-account-key="${account1Profile?.userID}"]`,
    );
    await expect(account1Switch).toBeVisible();
    await expect(account1Switch).toBeEnabled();

    await account1Switch.click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/#\/chat/, {
      timeout: 45000,
    });

    await expect
      .poll(async () => readStoredLoginState(page, account1Profile), {
        timeout: 15000,
      })
      .toMatchObject({
        chatToken: account1Profile?.chatToken,
        currentAccountKey: account1Profile?.userID,
        imToken: account1Profile?.imToken,
        userID: account1Profile?.userID,
      });
  });

  test("add friend search calls user get without sending request", async ({ page }) => {
    test.skip(
      !friendSearchKeyword,
      "Set OPENIM_E2E_FRIEND_SEARCH_KEYWORD to run add-friend search UI check.",
    );

    await loginAndExpectChat(page);

    const friendAddRequests: string[] = [];
    const unexpectedSearchRequests: string[] = [];
    page.on("request", (request) => {
      const requestUrl = request.url();
      const pathname = new URL(requestUrl).pathname;
      if (pathname.endsWith("/friends/add")) {
        friendAddRequests.push(requestUrl);
      }
      if (
        pathname.endsWith("/friends/page") ||
        pathname.endsWith("/user/public/search/list") ||
        pathname.endsWith("/user/getByAccount")
      ) {
        unexpectedSearchRequests.push(requestUrl);
      }
    });

    await page.locator('img[src*="show_more"]').click();
    await page.getByText(/添加好友|Add Friends/).click();

    const searchInput = page
      .locator('input[placeholder="请输入"], input[placeholder="Please enter"]')
      .last();
    await expect(searchInput).toBeVisible();
    await searchInput.fill(friendSearchKeyword ?? "");

    const searchResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        new URL(response.url()).pathname.endsWith("/user/get"),
      {
        timeout: 30000,
      },
    );

    await page.getByRole("button", { name: /确认|Confirm/ }).click();

    const searchResponse = await searchResponsePromise;
    expect(searchResponse.ok()).toBeTruthy();

    const searchBody = await searchResponse.json().catch(() => undefined);
    if (isRecord(searchBody)) {
      if ("errCode" in searchBody) {
        expect(searchBody.errCode).toBe(0);
      }
      if ("resultCode" in searchBody) {
        expect(searchBody.resultCode).toBe(1);
      }
    }

    const listItems = extractListItems(searchBody);
    const total = extractTotal(searchBody, listItems);

    if (expectedFriendSearchUserId) {
      const matched = listItems.some((item) => {
        if (!isRecord(item)) {
          return false;
        }
        const userId = pickText(item, ["userID", "userId", "id"]);
        return userId === expectedFriendSearchUserId;
      });

      expect(matched).toBeTruthy();
      await expect(searchInput).toBeHidden();
      await expect(
        page.getByText(expectedFriendSearchUserId, { exact: true }),
      ).toBeVisible();
    } else if (total === 0) {
      await expect(
        page.getByText(/未搜索到相关结果|No relevant results found/),
      ).toBeVisible();
    }

    await page.waitForTimeout(500);
    expect(friendAddRequests).toHaveLength(0);
    expect(unexpectedSearchRequests).toHaveLength(0);
  });
});
