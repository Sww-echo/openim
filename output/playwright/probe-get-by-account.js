async (page) => {
  return page.evaluate(async (phones) => {
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
    const fetchAccount = async (account) => {
      const res = await fetch(
        `/business-api/user/getByAccount?account=${encodeURIComponent(account)}&access_token=${encodeURIComponent(chatToken)}`,
        { headers: { token: chatToken } },
      );
      return res.json();
    };

    const results = {};
    for (const phone of phones) {
      results[phone] = await fetchAccount(phone);
    }
    return results;
  }, ["13962706201", "18296687666"]);
}
