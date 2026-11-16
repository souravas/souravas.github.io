/* /start's script: the prompt (prompt.js, shared with the trial
   designs in v2/ and v3/), and the copy kept for offline. */
import "./prompt.js";

/* ---------- Offline ----------
   /start is the browser's homepage, so it has to open instantly, even
   before the network is up. /sw.js serves a cached copy and refreshes
   it in the background. Production only: in dev it would serve stale
   copies over HMR. */
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js", { scope: "/start" }).catch(() => {});
}
