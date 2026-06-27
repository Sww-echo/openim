async (page) => {
  const base = "http://127.0.0.1:7777/index.html";
  const mainPhone = "13962706301";
  const friendPhone = "18296687666";
  const password = "Test123456";
  const groupName = `e2e-group-${Date.now()}`;
  const chatMessage = `E2E群消息-${Date.now()}`;

  const readProfileAccount = async (p) =>
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
        account: data.account,
        phone: data.phone ?? data.telephone,
        nickname: data.nickname,
      };
    });

  const registerUser = async (p, phone, nickname) => {
    await p.goto(`${base}#/login`);
    await p.getByText("立即注册").click();
    await p.getByRole("textbox", { name: "请输入手机号" }).fill(phone);
    await p.getByRole("textbox", { name: "* 昵称" }).fill(nickname);
    await p.getByRole("textbox", { name: "* 密码" }).fill(password);
    await p.getByRole("textbox", { name: "* 确认密码:" }).fill(password);
    await p.getByRole("button", { name: "确认" }).click();
    await p.waitForURL(/#\/chat/, { timeout: 60000 });
    await p.waitForTimeout(8000);
  };

  const loginUser = async (p, phone) => {
    await p.goto(`${base}#/login`);
    await p.getByRole("textbox", { name: "请输入手机号" }).fill(phone);
    await p.getByRole("textbox", { name: "* 密码" }).fill(password);
    await p.getByRole("button", { name: "登录" }).click();
    await p.waitForURL(/#\/chat/, { timeout: 60000 });
    await p.waitForTimeout(8000);
  };

  const openAddFriend = async (p) => {
    await p.locator('img[src*="show_more"]').click();
    await p.getByText("添加好友").click();
  };

  const searchFriend = async (p, keyword) => {
    const searchInput = p.getByRole("textbox", { name: "请输入" });
    await searchInput.fill(keyword);
    await p.getByRole("button", { name: "确认" }).click();
    await p.waitForTimeout(4000);
  };

  // 1) 主账号注册
  await page.goto(`${base}#/login`);
  await registerUser(page, mainPhone, "e2e-main-user");

  // 2) 新标签页登录好友账号，读取通讯号
  const friendPage = await page.context().newPage();
  let friendAccount = friendPhone;
  let friendProfile = null;
  try {
    await loginUser(friendPage, friendPhone);
    friendProfile = await readProfileAccount(friendPage);
    if (friendProfile?.account) {
      friendAccount = String(friendProfile.account);
    }
  } catch (error) {
    friendProfile = { loginFailed: String(error) };
  }

  // 3) 主账号搜索好友：先手机号，再通讯号
  await page.bringToFront();
  await openAddFriend(page);
  await searchFriend(page, friendPhone);
  let foundByPhone = await page
    .getByRole("button", { name: /添加好友/ })
    .last()
    .isVisible()
    .catch(() => false);

  if (!foundByPhone && friendAccount !== friendPhone) {
    await openAddFriend(page);
    await searchFriend(page, friendAccount);
    foundByPhone = await page
      .getByRole("button", { name: /添加好友/ })
      .last()
      .isVisible()
      .catch(() => false);
  }

  if (foundByPhone) {
    await page.getByRole("button", { name: /添加好友/ }).last().click();
    await page.waitForTimeout(2000);
  }

  // 4) 创建群聊
  await page.locator('img[src*="show_more"]').click();
  await page.getByText("创建群聊").click();
  await page.waitForTimeout(1000);

  const groupNameInput = page.locator('input[placeholder*="群"], input').first();
  const nameInputs = page.locator(".ant-modal input, .ant-modal .ant-input");
  if ((await nameInputs.count()) > 0) {
    await nameInputs.first().fill(groupName);
  }

  // 选择好友（若已在通讯录）
  const friendCheckbox = page.getByText(friendProfile?.nickname ?? friendPhone, { exact: false }).first();
  if (await friendCheckbox.isVisible().catch(() => false)) {
    await friendCheckbox.click();
  } else {
    const anyFriend = page.locator('[class*="CheckItem"], .cursor-pointer').filter({ hasText: /./ }).first();
    if (await anyFriend.isVisible().catch(() => false)) {
      await anyFriend.click();
    }
  }

  await page.getByRole("button", { name: /确认|Confirm/ }).last().click();
  await page.waitForTimeout(2000);

  const confirmModal = page.getByRole("button", { name: /确定|OK|确认/ });
  if (await confirmModal.isVisible().catch(() => false)) {
    await confirmModal.click();
    await page.waitForTimeout(5000);
  }

  // 5) 发送群消息
  const editor = page.locator('[contenteditable="true"]').last();
  if (await editor.isVisible().catch(() => false)) {
    await editor.click();
    await editor.fill(chatMessage);
    await page.getByRole("button", { name: "发送" }).click();
    await page.waitForTimeout(3000);
  }

  // 6) 群设置
  const settingsIcon = page.locator('img[src*="settings"]');
  if (await settingsIcon.isVisible().catch(() => false)) {
    await settingsIcon.click();
    await page.waitForTimeout(2000);

    const allMutedRow = page.getByText(/全员禁言|All Muted/).first();
    if (await allMutedRow.isVisible().catch(() => false)) {
      await allMutedRow.locator("..").locator("button, .ant-switch").first().click().catch(() => {});
      await page.waitForTimeout(500);
      const okBtn = page.getByRole("button", { name: /确定|OK|保存|确认/ });
      if (await okBtn.isVisible().catch(() => false)) {
        await okBtn.first().click();
      }
    }
  }

  const messageVisible = await page.getByText(chatMessage).isVisible().catch(() => false);

  return {
    mainPhone,
    friendPhone,
    friendAccount,
    friendProfile,
    foundByPhone,
    groupName,
    chatMessage,
    messageVisible,
    url: page.url(),
  };
}
