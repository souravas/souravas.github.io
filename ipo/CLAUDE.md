# /ipo

- Typing `souravas.com/ipo` opens the sites of /start's IPO bookmark (the grey-market premiums and Chittorgarh), as [/cloud](../cloud/CLAUDE.md) does for its Cloud bookmark: all but the first in new tabs, in order, then this tab moves to the first with `location.replace`.
- **The page is /cloud's, with another bookmark.** Its [main.js](main.js) and [style.css](style.css) only import [../shared/opener.js](../shared/opener.js) and [../shared/opener.css](../shared/opener.css), which both pages share; /cloud's notes cover how it behaves (blocked pop-ups, prerendering, layout) and hold for this page too.
- **The sites live in [../start/bookmarks.html](../start/bookmarks.html), never here.** [index.html](index.html) has a `<!--sites:IPO-->` marker, which the `start-bookmarks` plugin in vite.config.js (`bookmarkSites`) fills with the bookmark named IPO, its href then its `data-also`, in dev too. Renaming or removing that bookmark fails the build.
- No service worker; it loads the analytics beacon like every built page.
