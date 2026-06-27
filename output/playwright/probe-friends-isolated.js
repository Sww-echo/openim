async (page) => {
  const b = page.context().browser();
  const pages = (await Promise.all((await b.contexts()).map((c) => c.pages()))).flat();

  const probe = async (p) =>
    p.evaluate(async () => {
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
      const headers = { token: chatToken };
      const qs = `access_token=${encodeURIComponent(chatToken)}`;
      const user = await fetch(`/business-api/user/get?userId=${userID}&${qs}`, { headers }).then(
        (r) => r.json(),
      );
      const friends = await fetch(
        `/business-api/friends/page?userId=${userID}&pageIndex=1&pageSize=50&status=2&${qs}`,
        { headers },
      ).then((r) => r.json());
      const pending = await fetch(
        `/business-api/friends/page?userId=${userID}&pageIndex=1&pageSize=50&status=0&${qs}`,
        { headers },
      ).then((r) => r.json());
      const newFriends = await fetch(
        `/business-api/friends/newFriend/list?userId=${userID}&pageIndex=0&pageSize=50&${qs}`,
        { headers },
      ).then((r) => r.json());
      return { userID, nickname: user?.data?.nickname, friends, pending, newFriends };
    });

  const out = {};
  for (const p of pages) {
    if (!p.url().includes("127.0.0.1:7777")) continue;
    const key = p.url().includes("newFriends") ? "friendB" : p.url().includes("#/chat") ? "mainA" : p.url();
    out[key] = await probe(p).catch((e) => ({ error: String(e) }));
  }
  return out;
}
