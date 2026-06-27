async (page) => {
  const groupName = `e2e-group-${Date.now()}`;
  const chatMessage = `E2E群消息-${Date.now()}`;
  const steps = {};

  // 关闭所有弹窗
  for (let i = 0; i < 3; i++) {
    const cancel = page.getByRole("button", { name: "取消" });
    if (await cancel.isVisible().catch(() => false)) {
      await cancel.click({ force: true });
      await page.waitForTimeout(300);
    }
    const close = page.locator(".ant-modal-close, img[alt='close']").first();
    if (await close.isVisible().catch(() => false)) {
      await close.click({ force: true });
      await page.waitForTimeout(300);
    }
  }

  // 搜索好友（记录结果）
  await page.locator('img[src*="show_more"]').click({ force: true });
  await page.waitForTimeout(400);
  await page.getByText("添加好友", { exact: true }).last().click({ force: true });
  await page.getByRole("textbox", { name: "请输入" }).fill("18296687666");
  await page.getByRole("button", { name: "确认" }).click();
  await page.waitForTimeout(6000);
  steps.noResultVisible = await page
    .getByText(/未搜索到相关结果|No relevant results found/)
    .isVisible()
    .catch(() => false);
  steps.friendCardVisible = await page
    .getByRole("button", { name: /^添加好友$/ })
    .last()
    .isVisible()
    .catch(() => false);

  // 关闭添加好友弹窗
  await page.getByRole("button", { name: "取消" }).click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);

  // 创建群聊
  await page.getByRole("button", { name: "立即创建" }).click();
  await page.waitForTimeout(1500);

  const modal = page.locator(".ant-modal:visible");
  await modal.locator("input").first().fill(groupName);
  steps.groupNameFilled = true;

  await modal.getByRole("button", { name: "确认" }).click();
  await page.waitForTimeout(1500);

  const ok = page.getByRole("button", { name: /^确定$/ });
  if (await ok.isVisible().catch(() => false)) {
    await ok.click();
    await page.waitForTimeout(12000);
    steps.groupCreated = true;
  }

  // 发送消息
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
  return { groupName, chatMessage, steps, url: page.url() };
}
