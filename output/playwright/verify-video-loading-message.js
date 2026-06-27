async (page) => {
  await page.route("**/business-api/file/upload?**", async (route) => {
    await page.waitForTimeout(4000);
    await route.continue();
  });

  await page
    .locator('input[type="file"][accept="video/*"]')
    .setInputFiles(
      "C:/Users/sww/Documents/openim/openim-electron-demo/output/playwright/codex-video-check.webm",
    );
  await page.getByRole("button", { name: "确定" }).click();
  await page.waitForTimeout(500);

  const messages = await page.locator(".ant-message").allTextContents();
  const confirmModalCount = await page
    .getByText("确认上传并发送当前文件吗？")
    .count();

  await page.waitForTimeout(4500);
  await page.unroute("**/business-api/file/upload?**");

  return {
    messages,
    confirmModalCount,
  };
}
