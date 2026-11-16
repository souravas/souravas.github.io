/* /start/v2's script, which /start runs too: the build copies this
   page, the default design, there. /start's prompt (../prompt.js), and
   the copy kept for offline, which /sw.js serves at once under the
   scope of the address the page was opened at: /start/v2, or /start
   for the copy. Production only, as on the other designs. */
import "../prompt.js";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  const scope = location.pathname.replace(/\/(index\.html)?$/, "");
  navigator.serviceWorker.register("/sw.js", { scope }).catch(() => {});
}
