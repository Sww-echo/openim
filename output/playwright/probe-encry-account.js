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
    const byAccount = async (account) => {
      const res = await fetch(
        `/business-api/user/getByAccount?account=${encodeURIComponent(account)}&access_token=${encodeURIComponent(chatToken)}`,
        { headers: { token: chatToken } },
      );
      return res.json();
    };

    const encry = "70be8eba39ccc2abbf085e8b331050c3";
    return {
      encryAccount: await byAccount(encry),
      phone,
    };
  }, "13962706201");
}
