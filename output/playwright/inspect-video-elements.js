async (page) => {
  return page.locator("video").evaluateAll((videos) =>
    videos.map((video) => ({
      src: video.currentSrc || video.src,
      poster: video.poster,
      readyState: video.readyState,
      networkState: video.networkState,
      errorCode: video.error?.code,
    })),
  );
}
