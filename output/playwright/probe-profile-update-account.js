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
    const res = await fetch(
      `/business-api/user/profile/update?userId=${userID}&account=${encodeURIComponent(phone)}&phone=${encodeURIComponent(phone)}&telephone=${encodeURIComponent(phone)}&closeTelephoneFind=0&phoneSearch=1&access_token=${encodeURIComponent(chatToken)}`,
      { method: "POST", headers: { token: chatToken } },
    );
    const updateBody = await res.json().catch(async () => await res.text());
    const lookup = await fetch(
      `/business-api/user/getByAccount?account=${encodeURIComponent(phone)}&access_token=${encodeURIComponent(chatToken)}`,
      { headers: { token: chatToken } },
    );
    const lookupBody = await lookup.json();
    const publicSearch = await fetch(
      `/business-api/user/public/search/list?keyWorld=${encodeURIComponent(phone)}&page=0&limit=10&access_token=${encodeURIComponent(chatToken)}`,
      { headers: { token: chatToken } },
    );
    const publicBody = await publicSearch.json();
    return { updateBody, lookupBody: { resultCode: lookupBody.resultCode, userId: lookupBody.data?.userId }, publicBody };
  }, "13962706202");
}
