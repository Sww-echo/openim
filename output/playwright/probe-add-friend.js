async (page) => {
  const b = page.context().browser();
  const pages = (await Promise.all((await b.contexts()).map((c) => c.pages()))).flat();
  const main = pages.find((p) => p.url().includes("#/chat") && !p.url().includes("newFriends"));
  const friend = pages.find((p) => p.url().includes("newFriends"));

  const apiCall = async (p, path, params = {}) =>
    p.evaluate(
      async ({ path, params }) => {
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
        const qs = new URLSearchParams({ ...params, access_token: chatToken }).toString();
        const res = await fetch(`/business-api${path}?${qs}`, {
          method: "POST",
          headers: { token: chatToken },
        });
        return res.json();
      },
      { path, params },
    );

  const addFromMain = await apiCall(main, "/friends/add", { toUserId: "10000050" });
  const lastOnMain = await apiCall(main, "/friends/newFriend/last", { toUserId: "10000050" });
  const webOnFriend = friend
    ? await apiCall(friend, "/friends/newFriendListWeb", {
        userId: "10000050",
        pageIndex: 0,
        pageSize: 50,
      })
    : null;
  const addFromFriend = friend
    ? await apiCall(friend, "/friends/add", { toUserId: "10000049" })
    : null;

  return { addFromMain, lastOnMain, webOnFriend, addFromFriend };
}
