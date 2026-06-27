async (page) => {
  return page.evaluate(async (phone) => {
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
    const tryGet = async (query) => {
      const res = await fetch(
        `/business-api/user/getByAccount?${query}&access_token=${encodeURIComponent(chatToken)}`,
        { headers: { token: chatToken } },
      );
      const body = await res.json();
      return { resultCode: body.resultCode, userId: body.data?.userId, account: body.data?.account, phone: body.data?.phone };
    };
    return {
      accountParam: await tryGet(`account=${encodeURIComponent(phone)}`),
      userIdParam: await tryGet(`userId=${encodeURIComponent(phone)}`),
      bothParams: await tryGet(`account=${encodeURIComponent(phone)}&userId=${encodeURIComponent(phone)}`),
    };
  }, "18296687666");
}
