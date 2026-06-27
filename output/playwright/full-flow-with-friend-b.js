async (page) => {
  const password = "Test123456";
  const base = "http://127.0.0.1:7777/index.html";
  const mainPhone = "13962706301";
  const friendPhone = "13962706302";
  const groupName = "e2e-flow-group-0627";
  const chatMessage = `E2E群消息-${Date.now()}`;

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
        phone: String(data.phone ?? data.telephone ?? ""),
      };
    });

  const closeVisibleModals = async (p) => {
    for (let i = 0; i < 5; i++) {
      const modal = p.locator(".ant-modal-wrap:visible");
      if (!(await modal.count())) break;
      const cancel = p.locator(".ant-modal-wrap:visible").getByRole("button", { name: "取消" });
      if (await cancel.first().isVisible().catch(() => false)) {
        await cancel.first().click();
      } else {
        await p.keyboard.press("Escape");
      }
      await p.waitForTimeout(400);
    }
  };

  const register = async (p, phone, nickname) => {
    await p.goto(`${base}#/login`);
    await p.getByText("立即注册").click();
    await p.getByRole("textbox", { name: "请输入手机号" }).fill(phone);
    await p.getByRole("textbox", { name: "* 昵称" }).fill(nickname);
    await p.getByRole("textbox", { name: "* 密码" }).fill(password);
    await p.getByRole("textbox", { name: "* 确认密码:" }).fill(password);
    await p.getByRole("button", { name: "确认" }).click();
    await p.waitForURL(/#\/chat/, { timeout: 60000 });
    await p.waitForTimeout(10000);
  };

  // 注册好友账号 B（若已注册则直接登录读取通讯号）
  const friendPage = await page.context().newPage();
  await friendPage.goto(`${base}#/login`);
  await friendPage.getByText("立即注册").click();
  await friendPage.getByRole("textbox", { name: "请输入手机号" }).fill(friendPhone);
  await friendPage.getByRole("textbox", { name: "* 昵称" }).fill("e2e-friend-b");
  await friendPage.getByRole("textbox", { name: "* 密码" }).fill(password);
  await friendPage.getByRole("textbox", { name: "* 确认密码:" }).fill(password);
  await friendPage.getByRole("button", { name: "确认" }).click();
  const registered = await friendPage
    .waitForURL(/#\/chat/, { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  if (!registered) {
    await friendPage.goto(`${base}#/login`);
    await friendPage.getByRole("textbox", { name: "请输入手机号" }).fill(friendPhone);
    await friendPage.getByRole("textbox", { name: "请输入密码" }).fill(password);
    await friendPage.getByRole("button", { name: "登录" }).click();
    await friendPage.waitForURL(/#\/chat/, { timeout: 60000 });
  }
  await friendPage.waitForTimeout(8000);
  const friendProfile = await readAccount(friendPage);

  // 主账号 A 回到前台
  await page.bringToFront();
  await page.goto(`${base}#/chat`);
  await page.waitForTimeout(3000);

  const steps = { friendProfile };

  // 用通讯号搜索并加好友
  await page.locator('img[src*="show_more"]').click();
  await page.waitForTimeout(300);
  await page.getByRole("tooltip").getByText("添加好友").click();
  await page.getByRole("textbox", { name: "请输入" }).fill(friendProfile.account);
  await page.getByRole("button", { name: "确认" }).click();
  await page.waitForTimeout(5000);
  steps.foundByAccount = await page
    .getByRole("button", { name: /^添加好友$/ })
    .last()
    .isVisible()
    .catch(() => false);

  if (steps.foundByAccount) {
    await page.getByRole("button", { name: /^添加好友$/ }).last().click();
    await page.waitForTimeout(3000);
    steps.friendAdded = true;
  }

  // 关闭所有弹窗后再创建群聊
  await closeVisibleModals(page);
  await page.waitForTimeout(500);

  // 创建群聊
  await page.getByRole("button", { name: "立即创建" }).click({ force: true });
  await page.waitForTimeout(1500);
  await page.locator(".ant-modal:visible").getByRole("textbox", { name: "请输入" }).fill(groupName);

  // 展开我的好友并选择
  await page.getByText("我的好友").click();
  await page.waitForTimeout(1500);
  await page.getByText("e2e-friend-b").first().click();
  await page.waitForTimeout(500);

  await page.locator(".ant-modal:visible").getByRole("button", { name: "确认" }).click();
  await page.waitForTimeout(1500);
  const ok = page.getByRole("button", { name: /^确定$/ });
  if (await ok.isVisible().catch(() => false)) {
    await ok.click();
    await page.waitForTimeout(12000);
    steps.groupCreated = true;
  }

  // 发消息
  const editor = page.locator('[contenteditable="true"]').last();
  if (await editor.isVisible().catch(() => false)) {
    await editor.click();
    await editor.fill(chatMessage);
    await page.getByRole("button", { name: "发送" }).click();
    await page.waitForTimeout(5000);
    steps.messageSent = true;
  }
  steps.messageVisible = await page.getByText(chatMessage).isVisible().catch(() => false);

  // 群设置
  const settingsIcon = page.locator('img[src*="settings"]');
  if (await settingsIcon.isVisible().catch(() => false)) {
    await settingsIcon.click();
    await page.waitForTimeout(2000);
    steps.settingsOpened = true;
    const drawerSwitch = page.locator(".ant-drawer .ant-switch").first();
    if (await drawerSwitch.isVisible().catch(() => false)) {
      await drawerSwitch.click();
      await page.waitForTimeout(800);
      const confirm = page.getByRole("button", { name: /^确定$|^OK$|^保存$|^确认$/ });
      if (await confirm.first().isVisible().catch(() => false)) {
        await confirm.first().click();
        steps.settingChanged = true;
      }
    }
  }

  await page.screenshot({ path: "output/playwright/full-flow-result.png", scale: "css" });
  return { mainPhone, friendPhone, groupName, chatMessage, steps, url: page.url() };
}
