# /ipo

- Typing `souravas.com/ipo` opens the IPO trackers (ipowatch's grey-market premiums and Chittorgarh), as [/cloud](../cloud/CLAUDE.md) does for the cloud drives: all but the first in new tabs, in order, then this tab moves to the first with `location.replace`. /start's IPO key (in Finance, alias `ipo`) opens this page.
- **The page is /cloud's, with other sites.** Its [main.js](main.js) and [style.css](style.css) only import [../shared/opener.js](../shared/opener.js) and [../shared/opener.css](../shared/opener.css), which the opener pages share; /cloud's notes cover how it behaves (blocked pop-ups, prerendering, layout) and hold for this page too.
- **The sites are the `ol.sites` in [index.html](index.html)**, each a link with `target="_blank"` named by its host; change them there.
- No service worker; it loads the analytics beacon like every built page.
