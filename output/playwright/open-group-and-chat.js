async (page) => {
  const groupID = "3784632425";
  const groupName = "e2e-flow-group-0627";
  const chatMessage = `E2E群消息-${Date.now()}`;

  const b = page.context().browser();
  const main = (await Promise.all((await b.contexts()).map((c) => c.pages()))).flat().find(
    (p) => p.url().includes("#/chat") && !p.url().includes("newFriends"),
  );

  await main.bringToFront();
  await main.goto(`http://127.0.0.1:7777/index.html#/chat/${groupID}`);
  await main.waitForTimeout(12000);

  const steps = { url: main.url(), bodyText: await main.locator("body").innerText() };

  const editor = main.locator('[contenteditable="true"]').last();
  steps.editorVisible = await editor.isVisible().catch(() => false);
  if (steps.editorVisible) {
    await editor.click();
    await editor.fill(chatMessage);
    await main.getByRole("button", { name: "发送" }).click({ force: true });
    await main.waitForTimeout(5000);
    steps.messageSent = true;
  }
  steps.messageVisible = await main.getByText(chatMessage).isVisible().catch(() => false);

  const settingsIcon = main.locator('img[src*="settings"]');
  steps.settingsVisible = await settingsIcon.isVisible().catch(() => false);
  if (steps.settingsVisible) {
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
  return { groupID, groupName, chatMessage, steps };
}
