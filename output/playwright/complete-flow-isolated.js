async (page) => {
  const password = "Test123456";
  const base = "http://127.0.0.1:7777/index.html";
  const mainPhone = "13962706301";
  const friendPhone = "13962706302";
  const groupName = "e2e-flow-group-0627";
  const chatMessage = `E2E群消息-${Date.now()}`;

  const browser = page.context().browser();
  if (!browser) throw new Error("browser unavailable");

  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const main = await ctxA.newPage();
  const friendPage = await ctxB.newPage();

  const login = async (p, phone) => {
    await p.goto(`${base}#/login`);
    await p.getByRole("textbox", { name: "请输入手机号" }).fill(phone);
    await p.getByRole("textbox", { name: "* 密码" }).fill(password);
    await p.getByRole("button", { name: "登录" }).click();
    await p.waitForURL(/#\/chat/, { timeout: 90000 });
    await p.waitForTimeout(10000);
  };

  const readAccount = async (p) =>
    p.evaluate(async () => {
      const readKey = (key) =>
        new Promise((resolve, reject) => {
          const request = indexedDB.open("OpenCorp-Config");
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction("keyvaluepairs", "readonly");
            const store = tx.objectStore("keyvaluepairs");
            const getReq = store.get(key);
            getReq.onerror = () => reject(getReq.error);
            getReq.onsuccess = () => {
              const result = getReq.result;
              db.close();
              resolve(
                result && typeof result === "object" && "value" in result
                  ? result.value
                  : result,
              );
            };
          };
        });
      const chatToken = await readKey("IM_CHAT_TOKEN");
      const userID = await readKey("IM_USERID");
      const res = await fetch(
        `/business-api/user/get?userId=${userID}&access_token=${encodeURIComponent(chatToken)}`,
        { headers: { token: chatToken } },
      );
      const body = await res.json();
      const data = body.data ?? {};
      return {
        userID,
        account: String(data.account ?? ""),
        nickname: String(data.nickname ?? ""),
      };
    });

  await login(main, mainPhone);
  await login(friendPage, friendPhone);

  const mainProfile = await readAccount(main);
  const friendProfile = await readAccount(friendPage);
  const steps = { mainProfile, friendProfile };

  // A 搜索 B 并发送好友申请
  await main.locator('img[src*="show_more"]').click();
  await main.waitForTimeout(300);
  await main.getByRole("tooltip").getByText("添加好友").click();
  await main.getByRole("textbox", { name: "请输入" }).fill(friendProfile.account);
  await main.getByRole("button", { name: "确认" }).click();
  await main.waitForTimeout(4000);
  await main.getByRole("button", { name: /^添加好友$/ }).last().click();
  await main.waitForTimeout(1000);
  await main.locator(".ant-modal:visible").getByRole("button", { name: "发送" }).click();
  await main.waitForTimeout(500);
  await main.locator(".ant-modal-confirm").getByRole("button", { name: "确定" }).click();
  await main.waitForTimeout(4000);
  steps.requestSent = true;

  // B 接受好友
  await friendPage.goto(`${base}#/contact/newFriends`);
  await friendPage.waitForTimeout(6000);
  const agree = friendPage.getByRole("button", { name: "同意" }).first();
  steps.hasRequest = await agree.isVisible().catch(() => false);
  if (steps.hasRequest) {
    await agree.click();
    await friendPage.waitForTimeout(500);
    await friendPage.locator(".ant-modal-confirm").getByRole("button", { name: "确定" }).click();
    await friendPage.waitForTimeout(8000);
    steps.friendAccepted = true;
  }

  // A 创建群聊
  await main.keyboard.press("Escape");
  await main.goto(`${base}#/chat`);
  await main.waitForTimeout(3000);
  await main.getByRole("button", { name: "立即创建" }).click();
  await main.waitForTimeout(1500);
  await main.locator(".ant-modal:visible").getByRole("textbox", { name: "请输入" }).fill(groupName);
  await main.getByText("我的好友").click();
  await main.waitForTimeout(4000);
  const friendItem = main.locator(".ant-modal:visible").getByText("e2e-friend-b").first();
  steps.friendInList = await friendItem.isVisible().catch(() => false);
  if (steps.friendInList) {
    await friendItem.click();
    await main.waitForTimeout(500);
  }
  await main.locator(".ant-modal:visible").getByRole("button", { name: "确认" }).click();
  await main.waitForTimeout(1500);
  const createOk = main.locator(".ant-modal-confirm").getByRole("button", { name: "确定" });
  if (await createOk.isVisible().catch(() => false)) {
    await createOk.click();
    await main.waitForTimeout(15000);
    steps.groupCreated = true;
  }

  const editor = main.locator('[contenteditable="true"]').last();
  if (await editor.isVisible().catch(() => false)) {
    await editor.click();
    await editor.fill(chatMessage);
    await main.getByRole("button", { name: "发送" }).click();
    await main.waitForTimeout(5000);
    steps.messageSent = true;
  }
  steps.messageVisible = await main.getByText(chatMessage).isVisible().catch(() => false);

  const settingsIcon = main.locator('img[src*="settings"]');
  if (await settingsIcon.isVisible().catch(() => false)) {
    await settingsIcon.click();
    await main.waitForTimeout(2000);
    steps.settingsOpened = true;
    const drawerSwitch = main.locator(".ant-drawer .ant-switch").first();
    if (await drawerSwitch.isVisible().catch(() => false)) {
      await drawerSwitch.click();
      await main.waitForTimeout(800);
      const confirm = main.getByRole("button", { name: /^确定$/ });
      if (await confirm.first().isVisible().catch(() => false)) {
        await confirm.first().click();
        steps.settingChanged = true;
      }
    }
  }

  await main.screenshot({ path: "output/playwright/full-flow-result.png", scale: "css" });
  return { mainPhone, friendPhone, groupName, chatMessage, steps, url: main.url() };
}
