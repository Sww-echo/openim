async (page) => {
  const password = "Test123456";
  const base = "http://127.0.0.1:7777/index.html";
  const groupName = "e2e-flow-group-0627";
  const chatMessage = `E2E群消息-${Date.now()}`;

  const closeVisibleModals = async (p) => {
    for (let i = 0; i < 5; i++) {
      const wrap = p.locator(".ant-modal-wrap:visible");
      if (!(await wrap.count())) break;
      const cancel = wrap.getByRole("button", { name: "取消" });
      if (await cancel.first().isVisible().catch(() => false)) {
        await cancel.first().click();
      } else {
        await p.keyboard.press("Escape");
      }
      await p.waitForTimeout(400);
    }
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
        nickname: String(data.nickname ?? ""),
        phone: String(data.phone ?? data.telephone ?? ""),
      };
    });

  const ctx = page.context();
  const pages = ctx.pages();
  let main = pages.find((p) => p.url().includes("#/chat")) ?? page;
  let friendPage = null;

  for (const p of pages) {
    const profile = await readAccount(p).catch(() => null);
    if (profile?.nickname === "e2e-friend-b") friendPage = p;
    if (profile?.nickname === "e2e-main-user") main = p;
  }

  const steps = {};

  // B 接受好友申请
  if (friendPage) {
    await friendPage.bringToFront();
    await friendPage.goto(`${base}#/contact/newFriends`);
    await friendPage.waitForTimeout(3000);
    const agree = friendPage.getByRole("button", { name: "同意" }).first();
    steps.hasFriendRequest = await agree.isVisible().catch(() => false);
    if (steps.hasFriendRequest) {
      await agree.click();
      await friendPage.waitForTimeout(1000);
      const confirm = friendPage.getByRole("button", { name: /^确定$/ });
      if (await confirm.isVisible().catch(() => false)) {
        await confirm.click();
        await friendPage.waitForTimeout(5000);
        steps.friendAccepted = true;
      }
    }
  }

  // A 创建群聊
  await main.bringToFront();
  await closeVisibleModals(main);
  await main.goto(`${base}#/chat`);
  await main.waitForTimeout(3000);

  await main.getByRole("button", { name: "立即创建" }).click();
  await main.waitForTimeout(1500);
  await main.locator(".ant-modal:visible").getByRole("textbox", { name: "请输入" }).fill(groupName);
  await main.getByText("我的好友").click();
  await main.waitForTimeout(3000);

  const friendItem = main.getByText("e2e-friend-b").first();
  steps.friendInList = await friendItem.isVisible().catch(() => false);
  if (steps.friendInList) {
    await friendItem.click();
    await main.waitForTimeout(500);
  }

  await main.locator(".ant-modal:visible").getByRole("button", { name: "确认" }).click();
  await main.waitForTimeout(1500);
  const ok = main.getByRole("button", { name: /^确定$/ });
  if (await ok.isVisible().catch(() => false)) {
    await ok.click();
    await main.waitForTimeout(12000);
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
      const confirm = main.getByRole("button", { name: /^确定$|^OK$|^保存$|^确认$/ });
      if (await confirm.first().isVisible().catch(() => false)) {
        await confirm.first().click();
        steps.settingChanged = true;
      }
    }
  }

  await main.screenshot({ path: "output/playwright/full-flow-result.png", scale: "css" });
  return { groupName, chatMessage, steps, url: main.url() };
}
