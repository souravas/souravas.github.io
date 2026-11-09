# /start

[index.html](index.html) owns the groups, the links and their order; don't copy them into this file. A bookmark is a plain `<li>` link whose icon is a `<symbol>` in the page's inline SVG sprite (`si-*` Simple Icons, `logo-*` single-colour site logos, `mdi-*` Material Design Icons; 24×24, `currentColor`). Optional attributes:

- `data-alias`: space-separated short codes the prompt matches first.
- `data-search`: a search URL with `%s`; an alias plus a query (`lc two sum`) opens it.
- `data-also`: more URLs, space-separated, opened in new tabs along with the href.

The most used links are pinned above the groups in `ul.links.top`, as one row of icon tiles across the page; they belong to no group. A tile's name stays in the markup: CSS hides it from sight only, so screen readers and the prompt's matching still use it, and `main.js` sets it as the tile's tooltip.

The header comment in [main.js](main.js) describes how the prompt matches and ranks. Links open in the same tab because the page is the browser homepage. Set as a browser search engine, `https://souravas.com/start/?q=%s` takes the prompt's queries from the address bar: the page replaces itself with what Enter would open, or, when that opens several tabs (which needs a click or key press), leaves the query in the prompt. Clicking a group heading (a button injected by `main.js`) opens the whole group in new tabs; browsers block every tab after the first until the site is allowed pop-ups.

**Layout**: the eight pinned tiles share one row at every width, still 29px wide each at 320px; a ninth would narrow them further. Below 760px the groups stack in one column, each with its links in two columns. From 760px they run in four newspaper-style columns that the browser balances. The groups run Code and Design, then Learn, then Finance and Practice, then Media and Social, so the most used, Code and Design, share the first column. Learn, at thirteen links, is alone in its column and sets the columns' height, since a group never splits: at full size Social ends 14px above it, Design 134px and Practice 174px. Media stays out of the third column only because Finance, Practice and Media together outgrow Learn; after moving a group or adding links, check where the columns end. From 760px, rows and gaps shrink with the window's height (28px and 16px at the least), so the page fits without scrolling in a window about 540px tall; the formulas in `style.css` are tuned to the page's height (about 760px at full size), so check the fit again after adding links.

[public/start-sw.js](../public/start-sw.js) is registered by `main.js` in production with scope `/start`. It serves `/start` and `/start/` from cache and refreshes the cache in the background, so a deploy shows up on the second open.
