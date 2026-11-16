/* /start/v1's script: /start's prompt (../prompt.js, shared with the
   other designs in v2/ and v3/), and the copy kept for offline. */
import "../prompt.js";

/* ---------- Offline ----------
   /start is the browser's homepage, so it has to open instantly, even
   before the network is up. /sw.js serves a cached copy and refreshes
   it in the background, under the scope of the address this page was
   opened at: /start/v1, or /start when the build copies this design
   there as the default. Production only: in dev it would serve stale
   copies over HMR. */
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  const scope = location.pathname.replace(/\/(index\.html)?$/, "");
  navigator.serviceWorker.register("/sw.js", { scope }).catch(() => {});
}
