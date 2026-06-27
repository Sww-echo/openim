async (page) => {
  await page.getByText("返回").click();
  await page.getByRole("textbox", { name: "请输入手机号" }).fill("18296687666");
  await page.getByRole("textbox", { name: "* 密码" }).fill("Test123456");
  await page.getByRole("button", { name: "登录" }).click();
  await page.waitForTimeout(3000);
  return page.url();
}
