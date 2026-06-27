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
    const userID = await readKey("IM_USERID");
    const fetchApi = async (path) => {
      const res = await fetch(`${path}&access_token=${encodeURIComponent(chatToken)}`, {
        headers: { token: chatToken },
      });
      return res.json();
    };
    return {
      findEmployee: await fetchApi(
        `/business-api/org/employee/findEmployee?keyword=${encodeURIComponent(phone)}&userId=${userID}`,
      ),
      friendsPagePhone: await fetchApi(
        `/business-api/friends/page?userId=${userID}&keyword=${encodeURIComponent(phone)}&pageIndex=0&pageSize=10&status=0`,
      ),
    };
  }, "18296687666");
}
