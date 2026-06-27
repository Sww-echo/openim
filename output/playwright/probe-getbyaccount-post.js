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
    const postLookup = async (params) => {
      const query = new URLSearchParams({ ...params, access_token: chatToken }).toString();
      const res = await fetch(`/business-api/user/getByAccount?${query}`, {
        method: "POST",
        headers: { token: chatToken },
      });
      const body = await res.json();
      return { resultCode: body.resultCode, userId: body.data?.userId, account: body.data?.account, phone: body.data?.phone };
    };
    return {
      telephone: await postLookup({ telephone: phone }),
      phone: await postLookup({ phone }),
      accountPhone: await postLookup({ account: phone }),
    };
  }, "18296687666");
}
