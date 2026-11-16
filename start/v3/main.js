/* /start/v3's script: /start's prompt (../prompt.js), and the copy
   kept for offline, which /sw.js serves at once under the scope of the
   address the page was opened at: /start/v3, or /start if the build
   copies this design there as the default. Production only, as on the
   other designs. */
import "../prompt.js";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  const scope = location.pathname.replace(/\/(index\.html)?$/, "");
  navigator.serviceWorker.register("/sw.js", { scope }).catch(() => {});
}
