async (page) => {
  const base = "http://127.0.0.1:7777/index.html";
  const groupName = "e2e-flow-group-0627";
  const chatMessage = `E2E群消息-${Date.now()}`;

  const b = page.context().browser();
  const pages = (await Promise.all((await b.contexts()).map((c) => c.pages()))).flat();
  const main = pages.find((p) => p.url().includes("#/chat") && !p.url().includes("newFriends"));
  const steps = {};

  await main.bringToFront();
  await main.goto(`${base}#/contact/myFriends`);
  await main.waitForTimeout(8000);
  steps.contactText = await main.locator("body").innerText();

  await main.goto(`${base}#/chat`);
  await main.waitForTimeout(5000);

  for (let i = 0; i < 5; i++) {
    await main.keyboard.press("Escape");
    await main.waitForTimeout(200);
  }

  await main.getByRole("button", { name: "立即创建" }).click();
  await main.waitForTimeout(1500);
  await main.locator(".ant-modal:visible input").first().fill(groupName);
  await main.locator(".ant-modal:visible").getByText("我的好友").click();
  await main.waitForTimeout(5000);

  const modal = main.locator(".ant-modal:visible");
  steps.modalText = await modal.innerText();
  const friendItem = modal.getByText("e2e-friend-b").first();
  steps.friendInList = await friendItem.isVisible().catch(() => false);

  if (steps.friendInList) {
    await friendItem.click({ force: true });
    await main.waitForTimeout(500);
    await modal.getByRole("button", { name: "确认" }).click({ force: true });
    await main.waitForTimeout(1500);
    const createOk = main.locator(".ant-modal-confirm").getByRole("button", { name: "确定" });
    if (await createOk.isVisible().catch(() => false)) {
      await createOk.click({ force: true });
      await main.waitForTimeout(15000);
      steps.groupCreated = true;
    }
  }

  const editor = main.locator('[contenteditable="true"]').last();
  if (await editor.isVisible().catch(() => false)) {
    await editor.click();
    await editor.fill(chatMessage);
    await main.getByRole("button", { name: "发送" }).click({ force: true });
    await main.waitForTimeout(5000);
    steps.messageSent = true;
  }
  steps.messageVisible = await main.getByText(chatMessage).isVisible().catch(() => false);

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
