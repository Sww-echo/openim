async (page) => {
  return page.evaluate(async (keywords) => {
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
    const search = async (keyword) => {
      const res = await fetch(
        `/business-api/user/public/search/list?keyWorld=${encodeURIComponent(keyword)}&page=0&limit=10&access_token=${encodeURIComponent(chatToken)}`,
        { headers: { token: chatToken } },
      );
      return res.json();
    };
    const out = {};
    for (const k of keywords) out[k] = await search(k);
    return out;
  }, ["phone-search-test", "13962706202", "10000048580394", "18296687666"]);
}
