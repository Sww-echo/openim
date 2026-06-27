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
  await page.waitForTimeout(5000);
  return page.evaluate(async (targetPhone) => {
    const readKey = (key) =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open("OpenCorp-Config");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("keyvaluepairs", "readonly");
          const store = tx.objectStore("keyvaluepairs");
          const getReq = store.get(key);
          getReq.onerror = () => reject(getReq.error);
          getReq.onsuccess = () => {
            const result = getReq.result;
            db.close();
            resolve(
              result && typeof result === "object" && "value" in result
                ? result.value
                : result,
            );
          };
        };
      });
    const chatToken = await readKey("IM_CHAT_TOKEN");
    const res = await fetch(
      `/business-api/user/getByAccount?account=${encodeURIComponent(targetPhone)}&access_token=${encodeURIComponent(chatToken)}`,
      { headers: { token: chatToken } },
    );
    const body = await res.json();
    return {
      resultCode: body.resultCode,
      account: body.data?.account,
      phone: body.data?.phone ?? body.data?.telephone,
      nickname: body.data?.nickname,
      userId: body.data?.userId ?? body.data?.userID,
    };
  }, phone);
}
