async (page) => {
  await page.locator('img[src*="show_more"]').click();
  await page.waitForTimeout(500);
}
