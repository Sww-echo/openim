async (page) => {
  const base = "http://127.0.0.1:7777/index.html";
  const groupName = "e2e-flow-group-0627";
  const chatMessage = `E2E群消息-${Date.now()}`;

  const b = page.context().browser();
  const main = (await Promise.all((await b.contexts()).map((c) => c.pages()))).flat().find(
    (p) => p.url().includes("#/chat") && !p.url().includes("newFriends"),
  );

  const result = await main.evaluate(
    async ({ groupName, chatMessage }) => {
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
      const headers = { token: chatToken, "Content-Type": "application/json" };
      const qs = `access_token=${encodeURIComponent(chatToken)}`;

      const friendList = await fetch(`/business-api/friends/list?${qs}`, {
        method: "POST",
        headers,
      }).then((r) => r.json());

      const createRes = await fetch(`/business-api/room/add?${qs}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          room: {
            roomName: groupName,
            groupName: groupName,
            name: groupName,
            subject: groupName,
          },
          text: ["10000050"],
          keys: "openim-web-create-group",
        }),
      }).then((r) => r.json());

      return { friendList, createRes };
    },
    { groupName, chatMessage },
  );

  await main.reload();
  await main.waitForTimeout(12000);

  const steps = { api: result };
  const groupItem = main.getByText(groupName).first();
  steps.groupInList = await groupItem.isVisible().catch(() => false);
  if (steps.groupInList) {
    await groupItem.click();
    await main.waitForTimeout(5000);
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
    }
  }

  await main.screenshot({ path: "output/playwright/full-flow-result.png", scale: "css" });
  return { groupName, chatMessage, steps, url: main.url() };
}
