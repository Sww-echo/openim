async (page) => {
  const base = "http://127.0.0.1:7777/index.html";
  const groupName = "e2e-flow-group-0627";
  const chatMessage = `E2E群消息-${Date.now()}`;
  const steps = {};

  const ctx = page.context();
  const main = ctx.pages()[0];
  const friendPage = ctx.pages()[1];

  // 1. 发送好友申请（当前已打开用户卡片）
  await main.bringToFront();
  const addBtn = main.getByRole("button", { name: /^添加好友$/ }).last();
  if (await addBtn.isVisible().catch(() => false)) {
    await addBtn.click({ force: true });
    await main.waitForTimeout(1000);
    const sendBtn = main.locator(".ant-modal:visible").getByRole("button", { name: "发送" });
    if (await sendBtn.isVisible().catch(() => false)) {
      await sendBtn.click({ force: true });
      await main.waitForTimeout(500);
      await main.locator(".ant-modal-confirm").getByRole("button", { name: "确定" }).click({ force: true });
      await main.waitForTimeout(3000);
      steps.requestSent = true;
    }
  }

  // 2. B 接受好友
  await friendPage.bringToFront();
  await friendPage.goto(`${base}#/contact/newFriends`);
  await friendPage.waitForTimeout(6000);
  const agree = friendPage.getByRole("button", { name: "同意" }).first();
  steps.hasRequest = await agree.isVisible().catch(() => false);
  if (steps.hasRequest) {
    await agree.click({ force: true });
    await friendPage.waitForTimeout(500);
    await friendPage.locator(".ant-modal-confirm").getByRole("button", { name: "确定" }).click({ force: true });
    await friendPage.waitForTimeout(8000);
    steps.friendAccepted = true;
  }

  // 3. 创建群聊
  await main.bringToFront();
  await main.keyboard.press("Escape");
  await main.waitForTimeout(500);
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
    await friendItem.click({ force: true });
    await main.waitForTimeout(500);
  }

  await main.locator(".ant-modal:visible").getByRole("button", { name: "确认" }).click({ force: true });
  await main.waitForTimeout(1500);
  const createOk = main.locator(".ant-modal-confirm").getByRole("button", { name: "确定" });
  if (await createOk.isVisible().catch(() => false)) {
    await createOk.click({ force: true });
    await main.waitForTimeout(15000);
    steps.groupCreated = true;
  }

  // 4. 发消息
  const editor = main.locator('[contenteditable="true"]').last();
  if (await editor.isVisible().catch(() => false)) {
    await editor.click();
    await editor.fill(chatMessage);
    await main.getByRole("button", { name: "发送" }).click({ force: true });
    await main.waitForTimeout(5000);
    steps.messageSent = true;
  }
  steps.messageVisible = await main.getByText(chatMessage).isVisible().catch(() => false);

  // 5. 群设置
  const settingsIcon = main.locator('img[src*="settings"]');
  if (await settingsIcon.isVisible().catch(() => false)) {
    await settingsIcon.click({ force: true });
    await main.waitForTimeout(2000);
    steps.settingsOpened = true;
    const drawerSwitch = main.locator(".ant-drawer .ant-switch").first();
    if (await drawerSwitch.isVisible().catch(() => false)) {
      await drawerSwitch.click({ force: true });
      await main.waitForTimeout(800);
      const confirm = main.getByRole("button", { name: /^确定$/ });
      if (await confirm.first().isVisible().catch(() => false)) {
        await confirm.first().click({ force: true });
        steps.settingChanged = true;
      }
    }
  }

  await main.screenshot({ path: "output/playwright/full-flow-result.png", scale: "css" });
  return { groupName, chatMessage, steps, url: main.url() };
}
