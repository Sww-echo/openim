async (page) => {
  return page.evaluate(async () => {
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
    const userID = await readKey("IM_USERID");
    const res = await fetch(
      `/business-api/user/get?userId=${userID}&access_token=${encodeURIComponent(chatToken)}`,
      { headers: { token: chatToken } },
    );
    const body = await res.json();
    const data = body.data ?? {};
    return {
      userID,
      account: data.account,
      phone: data.phone ?? data.telephone,
      nickname: data.nickname,
      profileAccount: data.profileCards?.find((c) => c.type === "account")?.value,
    };
  });
}
