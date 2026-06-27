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
      const res = await fetch(
        `${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(chatToken)}`,
        { headers: { token: chatToken } },
      );
      const text = await res.text();
      return { status: res.status, body: text.slice(0, 1500) };
    };

    return {
      checkOpenAccount: await fetchApi(
        `/business-api/open/ckeckOpenAccountt?telephone=${encodeURIComponent(phone)}`,
      ),
      verifyTelephone: await fetchApi(
        `/business-api/verify/telephone?telephone=${encodeURIComponent(phone)}`,
      ),
    };
  }, "18296687666");
}
