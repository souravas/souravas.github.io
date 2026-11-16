/* /start/v3's script: /start's prompt (../prompt.js), and the copy
   kept for offline, which /sw.js serves at once, as it does /start's,
   under this page's own scope. Production only, as on /start. */
import "../prompt.js";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js", { scope: "/start/v3" }).catch(() => {});
}
