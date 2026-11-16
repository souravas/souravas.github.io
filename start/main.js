/* /start's script: its prompt (prompt.js), and the copy kept for
   offline, which /sw.js serves at once, so the page opens instantly
   and without a network. Production only: in dev it would serve
   stale copies over HMR. */
import "./prompt.js";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js", { scope: "/start" }).catch(() => {});
}
