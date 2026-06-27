async (page) => {
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext("2d");
    const stream = canvas.captureStream(10);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
      ? "video/webm;codecs=vp8"
      : "video/webm";
    const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    const done = new Promise((resolve) => {
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        resolve(Array.from(new Uint8Array(await blob.arrayBuffer())));
      };
    });

    recorder.start();
    for (let i = 0; i < 18; i += 1) {
      ctx.fillStyle = i % 2 ? "#1f6feb" : "#22c55e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.font = "18px sans-serif";
      ctx.fillText(`codex ${i}`, 36, 50);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    recorder.stop();
    stream.getTracks().forEach((track) => track.stop());

    return done;
  });

  const buffer = Uint8Array.from(bytes);
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "视频" }).click();
  const chooser = await chooserPromise;

  await chooser.setFiles({
    name: "codex-video-check.webm",
    mimeType: "video/webm",
    buffer,
  });
  await page.getByRole("button", { name: "确定" }).click();
  await page.waitForTimeout(12000);

  return {
    size: buffer.length,
    url: page.url(),
  };
}
