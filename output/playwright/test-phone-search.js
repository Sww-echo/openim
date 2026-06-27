async (page) => {
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.goto("http://127.0.0.1:7777/index.html#/login");
  await page.getByText("立即注册").click();
  const phone = "13962706202";
  await page.getByRole("textbox", { name: "请输入手机号" }).fill(phone);
  await page.getByRole("textbox", { name: "* 昵称" }).fill("phone-search-test");
  await page.getByRole("textbox", { name: "* 密码" }).fill("Test123456");
  await page.getByRole("textbox", { name: "* 确认密码:" }).fill("Test123456");
  await page.getByRole("button", { name: "确认" }).click();
  await page.waitForURL(/#\/chat/, { timeout: 45000 });
  await page.waitForTimeout(8000);
  await page.locator('img[src*="show_more"]').click();
  await page.getByText("添加好友").click();
  const searchInput = page.getByRole("textbox", { name: "请输入" });
  await searchInput.fill(phone);
  await page.getByRole("button", { name: "确认" }).click();
  await page.waitForTimeout(5000);
  const hasCard = await page.getByText("phone-search-test").isVisible().catch(() => false);
  const hasNoResult = await page
    .getByText(/未搜索到相关结果|No relevant results found/)
    .isVisible()
    .catch(() => false);
  return { phone, hasCard, hasNoResult, url: page.url() };
}
