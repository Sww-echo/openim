async (page) => {
  return page.evaluate(async (keyword) => {
    const readKey = (key) =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open("OpenCorp-Config");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("keyvaluepairs")) {
            db.close();
            resolve(undefined);
            return;
          }
          const tx = db.transaction("keyvaluepairs", "readonly");
          const store = tx.objectStore("keyvaluepairs");
          const getReq = store.get(key);
          getReq.onerror = () => {
            db.close();
            reject(getReq.error);
          };
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

    const fetchWithToken = async (url) => {
      const sep = url.includes("?") ? "&" : "?";
      const res = await fetch(`${url}${sep}access_token=${encodeURIComponent(chatToken)}`, {
        headers: { token: chatToken },
      });
      return {
        status: res.status,
        body: await res.json().catch(async () => await res.text()),
      };
    };

    const endpoints = [
      `/business-api/user/getByAccount?account=${keyword}`,
      `/business-api/user/public/search/list?keyWorld=${keyword}&page=0&limit=10`,
      `/business-api/friends/page?userId=${userID}&keyword=${keyword}&pageIndex=0&pageSize=10`,
      `/business-api/user/getByAccount?account=+86${keyword}`,
    ];

    const results = {};
    for (const url of endpoints) {
      results[url] = await fetchWithToken(url);
    }

    return { userID, results };
  }, "18296687666");
}
