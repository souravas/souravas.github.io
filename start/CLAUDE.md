# /start

[index.html](index.html) owns the groups, the links and their order; don't copy them into this file. A bookmark is a plain `<li>` link whose icon is a `<symbol>` in the page's inline SVG sprite (`si-*` Simple Icons, `logo-*` single-colour site logos, `mdi-*` Material Design Icons; 24×24, `currentColor`). Optional attributes:

- `data-alias`: space-separated short codes the prompt matches first.
- `data-search`: a search URL with `%s`; an alias plus a query (`lc two sum`) opens it.
- `data-also`: more URLs, space-separated, opened in new tabs along with the href.

The most used links are pinned above the groups in `ul.links.top`, as tiles across the page with their names; they belong to no group. Now, the bolt at the prompt's end (or `now` typed into it), opens every pinned link in new tabs in page order, so pinning a link adds it to Now. The bolt is `hidden` in the markup until `main.js` finds a pinned link.

The header comment in [main.js](main.js) describes how the prompt matches and ranks. Links open in the same tab because the page is the browser homepage. Set as a browser search engine, `https://souravas.com/start/?q=%s` takes the prompt's queries from the address bar: the page replaces itself with what Enter would open, or, when that opens several tabs (which needs a click or key press), leaves the query in the prompt. Clicking a group heading (a button injected by `main.js`) opens the whole group in new tabs; browsers block every tab after the first until the site is allowed pop-ups.

**Layout**: below 760px the pinned tiles sit three to a row and the groups stack in one column, each with its links in two columns. From 760px the tiles make one row and the groups run in four newspaper-style columns that the browser balances. The most used groups come first, so they sit on the left: Plan and Code, then Design and Learn, then Practice, Read and Media, then Finance and Social, an order that also makes the four columns end close together (within three rows; the orders that do better split Plan from Code). After moving a group or adding links, check where the columns end. Rows and gaps grow with the window's height, and the page fits without scrolling in a window about 870px tall.

[public/start-sw.js](../public/start-sw.js) is registered by `main.js` in production with scope `/start`. It serves `/start` and `/start/` from cache and refreshes the cache in the background, so a deploy shows up on the second open.
