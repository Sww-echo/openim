async (page) => {
  return page.evaluate(async (phone) => {
    const res = await fetch(
      `/business-api/account/code/send?phoneNumber=${encodeURIComponent(phone)}&telephone=${encodeURIComponent(phone)}&areaCode=%2B86&enterpriseCode=LOCALTEST001&usedFor=1`,
      { method: "POST" },
    );
    return res.json();
  }, "18296687666");
}
