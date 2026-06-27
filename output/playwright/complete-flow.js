async (page) => {
  const password = "Test123456";
  const base = "http://127.0.0.1:7777/index.html";
  const mainPhone = "13962706301";
  const friendPhone = "13962706302";
  const groupName = "e2e-flow-group-0627";
  const chatMessage = `E2E群消息-${Date.now()}`;

  const closeVisibleModals = async (p) => {
    for (let i = 0; i < 6; i++) {
      const wrap = p.locator(".ant-modal-wrap:visible");
      if (!(await wrap.count())) break;
      const ok = wrap.getByRole("button", { name: /^确定$|^确认$|^OK$/ });
      const cancel = wrap.getByRole("button", { name: "取消" });
      if (await ok.first().isVisible().catch(() => false)) {
        await ok.first().click();
      } else if (await cancel.first().isVisible().catch(() => false)) {
        await cancel.first().click();
      } else {
        await p.keyboard.press("Escape");
      }
      await p.waitForTimeout(400);
    }
  };

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
        phone: String(data.phone ?? data.telephone ?? ""),
      };
    });

  const sendFriendRequest = async (main, account) => {
    await closeVisibleModals(main);
    await main.goto(`${base}#/chat`);
    await main.waitForTimeout(2000);
    await main.locator('img[src*="show_more"]').click();
    await main.waitForTimeout(300);
    await main.getByRole("tooltip").getByText("添加好友").click();
    await main.getByRole("textbox", { name: "请输入" }).fill(account);
    await main.getByRole("button", { name: "确认" }).click();
    await main.waitForTimeout(4000);

    const addBtn = main.getByRole("button", { name: /^添加好友$/ }).last();
    if (!(await addBtn.isVisible().catch(() => false))) return false;

    await addBtn.click();
    await main.waitForTimeout(1000);

    // 好友验证页 -> 发送
    const sendBtn = main.locator(".ant-modal:visible").getByRole("button", { name: "发送" });
    if (await sendBtn.isVisible().catch(() => false)) {
      await sendBtn.click();
      await main.waitForTimeout(500);
      const confirm = main.locator(".ant-modal-wrap:visible").getByRole("button", { name: /^确定$/ });
      if (await confirm.last().isVisible().catch(() => false)) {
        await confirm.last().click();
        await main.waitForTimeout(3000);
      }
    }
    await closeVisibleModals(main);
    return true;
  };

  const acceptFriendRequest = async (friendPage) => {
    await friendPage.goto(`${base}#/contact/newFriends`);
    await friendPage.waitForTimeout(5000);
    const agree = friendPage.getByRole("button", { name: "同意" }).first();
    if (!(await agree.isVisible().catch(() => false))) return false;
    await agree.click();
    await friendPage.waitForTimeout(500);
    const confirm = friendPage.locator(".ant-modal-wrap:visible").getByRole("button", { name: /^确定$/ });
    if (await confirm.last().isVisible().catch(() => false)) {
      await confirm.last().click();
      await friendPage.waitForTimeout(8000);
    }
    return true;
  };

  const ctx = page.context();
  for (const p of ctx.pages()) {
    if (p.url().includes("127.0.0.1:7777")) await p.close().catch(() => {});
  }

  const main = await ctx.newPage();
  const friendPage = await ctx.newPage();
  await login(main, mainPhone);
  await login(friendPage, friendPhone);

  const friendProfile = await readAccount(friendPage);
  const steps = { friendProfile };

  steps.requestSent = await sendFriendRequest(main, friendProfile.account);
  steps.friendAccepted = await acceptFriendRequest(friendPage);

  await main.bringToFront();
  await closeVisibleModals(main);
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
  const createOk = main.locator(".ant-modal-wrap:visible").getByRole("button", { name: /^确定$/ });
  if (await createOk.last().isVisible().catch(() => false)) {
    await createOk.last().click();
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
      const confirm = main.getByRole("button", { name: /^确定$|^OK$|^保存$|^确认$/ });
      if (await confirm.first().isVisible().catch(() => false)) {
        await confirm.first().click();
        steps.settingChanged = true;
      }
    }
  }

  await main.screenshot({ path: "output/playwright/full-flow-result.png", scale: "css" });
  return { mainPhone, friendPhone, groupName, chatMessage, steps, url: main.url() };
}
