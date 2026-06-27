async (page) => {
  return page.evaluate(async (keyword) => {
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

    const fetchWithToken = async (url) => {
      const sep = url.includes("?") ? "&" : "?";
      const res = await fetch(`${url}${sep}access_token=${encodeURIComponent(chatToken)}`, {
        headers: { token: chatToken },
      });
      return res.json();
    };

    const statuses = [0, 1, 2, undefined];
    const results = {};
    for (const status of statuses) {
      const statusParam = status === undefined ? "" : `&status=${status}`;
      results[`status=${status}`] = await fetchWithToken(
        `/business-api/friends/page?userId=${userID}&keyword=${keyword}&pageIndex=0&pageSize=10${statusParam}`,
      );
    }

    return { userID, results };
  }, "18296687666");
}
