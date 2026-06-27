async (page) => {
  const base = "http://127.0.0.1:7777/index.html";
  const mainPhone = "13962706301";
  const friendPhone = "18296687666";
  const password = "Test123456";
  const groupName = `e2e-group-${Date.now()}`;
  const chatMessage = `E2E群消息-${Date.now()}`;

  const registerUser = async (p, phone, nickname) => {
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

  const steps = {};

  // 1) 注册主账号
  await registerUser(page, mainPhone, "e2e-main-user");
  steps.registered = true;

  // 2) 搜索好友（手机号）
  await page.locator('img[src*="show_more"]').click();
  await page.getByText("添加好友").click();
  await page.getByRole("textbox", { name: "请输入" }).fill(friendPhone);
  await page.getByRole("button", { name: "确认" }).click();
  await page.waitForTimeout(5000);

  steps.friendCardVisible = await page
    .getByRole("button", { name: /^添加好友$/ })
    .last()
    .isVisible()
    .catch(() => false);
  steps.noResultVisible = await page
    .getByText(/未搜索到相关结果|No relevant results found/)
    .isVisible()
    .catch(() => false);

  if (steps.friendCardVisible) {
    await page.getByRole("button", { name: /^添加好友$/ }).last().click();
    await page.waitForTimeout(3000);
    steps.friendRequestSent = true;
  }

  // 3) 创建群聊
  await page.locator('img[src*="show_more"]').click();
  await page.getByText("创建群聊").click();
  await page.waitForTimeout(1500);

  const modalInputs = page.locator(".ant-modal input:visible, .ant-modal textarea:visible");
  const inputCount = await modalInputs.count();
  if (inputCount > 0) {
    await modalInputs.first().fill(groupName);
  }

  const checkItems = page.locator(".ant-modal .cursor-pointer, .ant-modal [class*='CheckItem']");
  if ((await checkItems.count()) > 0) {
    await checkItems.first().click();
    steps.selectedMember = true;
  }

  await page.locator(".ant-modal").getByRole("button", { name: "确认" }).click();
  await page.waitForTimeout(1500);

  const confirmBtn = page.getByRole("button", { name: /^确定$|^OK$/ });
  if (await confirmBtn.isVisible().catch(() => false)) {
    await confirmBtn.click();
    await page.waitForTimeout(8000);
    steps.groupCreated = true;
  }

  // 4) 发送群消息
  const editor = page.locator('[contenteditable="true"]').last();
  if (await editor.isVisible().catch(() => false)) {
    await editor.click();
    await editor.fill(chatMessage);
    await page.getByRole("button", { name: "发送" }).click();
    await page.waitForTimeout(4000);
    steps.messageSent = true;
  }

  steps.messageVisible = await page.getByText(chatMessage).isVisible().catch(() => false);

  // 5) 群设置
  const settingsIcon = page.locator('img[src*="settings"]');
  if (await settingsIcon.isVisible().catch(() => false)) {
    await settingsIcon.click();
    await page.waitForTimeout(2000);
    steps.settingsOpened = true;

    const drawer = page.locator(".chat-drawer, .ant-drawer");
    if (await drawer.isVisible().catch(() => false)) {
      const switchEl = drawer.locator(".ant-switch").first();
      if (await switchEl.isVisible().catch(() => false)) {
        await switchEl.click();
        await page.waitForTimeout(800);
        const ok = page.getByRole("button", { name: /^确定$|^OK$|^保存$|^确认$/ });
        if (await ok.first().isVisible().catch(() => false)) {
          await ok.first().click();
          steps.settingChanged = true;
        }
      }
    }
  }

  await page.screenshot({ path: "output/playwright/full-flow-result.png", scale: "css" });

  return {
    mainPhone,
    friendPhone,
    groupName,
    chatMessage,
    steps,
    url: page.url(),
  };
}
