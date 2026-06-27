async (page) => {
  const b = page.context().browser();
  const pages = (await Promise.all((await b.contexts()).map((c) => c.pages()))).flat();
  const main = pages.find((p) => p.url().includes("#/chat"));
  const friend = pages.find((p) => p.url().includes("newFriends"));
  const steps = {};

  await main.bringToFront();
  for (let i = 0; i < 5; i++) {
    await main.keyboard.press("Escape");
    await main.waitForTimeout(200);
  }

  await main.locator('img[src*="show_more"]').click();
  await main.waitForTimeout(300);
  await main.getByRole("tooltip").getByText("添加好友").click();
  await main.getByRole("textbox", { name: "请输入" }).fill("10000050510501");
  await main.getByRole("button", { name: "确认" }).click();
  await main.waitForTimeout(4000);
  await main.getByRole("button", { name: /^添加好友$/ }).last().click();
  await main.waitForTimeout(1000);
  await main.locator(".ant-modal:visible").getByRole("button", { name: "发送" }).click();
  await main.waitForTimeout(500);
  await main.locator(".ant-modal-confirm").getByRole("button", { name: "确定" }).click();
  await main.waitForTimeout(5000);
  steps.sent = true;

  if (friend) {
    await friend.bringToFront();
    await friend.reload();
    await friend.waitForTimeout(8000);
    const agree = friend.getByRole("button", { name: "同意" }).first();
    steps.hasRequest = await agree.isVisible().catch(() => false);
    if (steps.hasRequest) {
      await agree.click();
      await friend.locator(".ant-modal-confirm").getByRole("button", { name: "确定" }).click();
      await friend.waitForTimeout(10000);
      steps.accepted = true;
    }
    steps.friendText = await friend.locator("body").innerText();
  }

  return steps;
}
