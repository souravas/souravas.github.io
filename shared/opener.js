/* ============================================================
   /cloud, /ipo and /invest: each opens the sites of the /start
   bookmarks its marker names (Cloud, IPO; Kite, Coin and
   Cashflow), which the start-bookmarks plugin puts in as the
   .sites list (each href, then its data-also). The others
   open in new tabs, in order, and then this tab becomes the
   first with location.replace, so typing souravas.com/cloud
   leaves exactly those tabs, and Back from the first skips this
   page. Each page's main.js only imports this.

   A page may open tabs by itself only once its site is allowed
   pop-ups. Until then browsers block every one, and a click lets
   one through. So this tab leaves only after every other site
   has opened: while one is blocked, the page stays up, marks the
   ones that opened, says why, and offers a button that tries
   the rest again, one more per click while pop-ups stay blocked.

   A page that Chrome prerenders while the address is typed waits
   until it is really opened, so typing never opens the tabs.
   ============================================================ */

const [here, ...others] = document.querySelectorAll(".sites a");
const blocked = document.getElementById("blocked");
let waiting = others;

const open = () => {
  // window.open only reports a blocked tab (null) without noopener,
  // so drop the opener by hand instead.
  waiting = waiting.filter((a) => {
    const tab = window.open(a.href, "_blank");
    if (!tab) return true;
    tab.opener = null;
    a.dataset.opened = "";
    return false;
  });
  if (waiting.length) blocked.hidden = false;
  else location.replace(here.href);
};

document.getElementById("retry").addEventListener("click", open);

if (here) {
  if (document.prerendering) document.addEventListener("prerenderingchange", open, { once: true });
  else open();
}
