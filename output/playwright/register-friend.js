async (page) => {
  await page.context().newPage();
  const pages = page.context().pages();
  const friendPage = pages[pages.length - 1];
  await friendPage.goto("http://127.0.0.1:7777/index.html#/login");
  await friendPage.getByText("立即注册").click();
  await friendPage.getByRole("textbox", { name: "请输入手机号" }).fill("18296687666");
  await friendPage.getByRole("textbox", { name: "* 昵称" }).fill("friend-18296687666");
  await friendPage.getByRole("textbox", { name: "* 密码" }).fill("Test123456");
  await friendPage.getByRole("textbox", { name: "* 确认密码:" }).fill("Test123456");
  await friendPage.getByRole("button", { name: "确认" }).click();
  await friendPage.waitForURL(/#\/chat/, { timeout: 45000 });
  return friendPage.url();
}
