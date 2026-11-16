# /invest

- Typing `souravas.com/invest` opens Kite, Coin and the Cashflow sheet, as [/cloud](../cloud/CLAUDE.md) does for its Cloud bookmark: all but the first in new tabs, in order, then this tab moves to the first (Kite) with `location.replace`.
- **The page is /cloud's, with other bookmarks.** Its [main.js](main.js) and [style.css](style.css) only import [../shared/opener.js](../shared/opener.js) and [../shared/opener.css](../shared/opener.css); /cloud's notes cover how it behaves (blocked pop-ups, prerendering, layout) and hold for this page too.
- **The sites live in [../start/bookmarks.html](../start/bookmarks.html), never here.** Unlike /cloud and /ipo, it opens three bookmarks rather than one: [index.html](index.html)'s marker is `<!--sites:Kite, Coin, Cashflow-->`, and the `start-bookmarks` plugin in vite.config.js (`bookmarkSites`) puts in each one's href then its `data-also`, in that order, in dev too. Renaming or removing any of the three fails the build.
- No service worker; it loads the analytics beacon like every built page.
