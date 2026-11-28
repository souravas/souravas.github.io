import "../shared/document-reader.js";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js", { scope: "/systemdesign" }).catch(() => {});
}
