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
    const fetchApi = async (path) => {
      const res = await fetch(`${path}&access_token=${encodeURIComponent(chatToken)}`, {
        headers: { token: chatToken },
      });
      return res.json();
    };
    return {
      keyWorld: await fetchApi(
        `/business-api/user/public/search/list?keyWorld=${encodeURIComponent(phone)}&page=0&limit=10`,
      ),
      phoneParam: await fetchApi(
        `/business-api/user/public/search/list?phone=${encodeURIComponent(phone)}&page=0&limit=10`,
      ),
      telephoneParam: await fetchApi(
        `/business-api/user/public/search/list?telephone=${encodeURIComponent(phone)}&page=0&limit=10`,
      ),
    };
  }, "13962706202");
}
