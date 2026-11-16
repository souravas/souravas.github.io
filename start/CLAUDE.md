# /start — Keypad

The browser homepage: every bookmark a key, each group a block of keys under its name, the blocks closing into one rectangle sized to the window. [index.html](index.html) holds the bookmarks, [style.css](style.css) the layout, [prompt.js](prompt.js) the prompt, and [main.js](main.js) imports the prompt and registers the service worker.

Until November 2026 /start had three designs: the first (lists in columns, at /start/v1), *Keypad* (/start/v2) and *Shelves* (/start/v3, a trial), all sharing a `start/bookmarks.html` that a `start-bookmarks` Vite plugin put into each. The user kept Keypad; the others were deleted, Keypad moved up to `start/`, and the bookmarks went into its page. The old designs are in the git history.

**Bookmarks**: the groups, the links and their order are in [index.html](index.html); don't copy them into this file. A bookmark is a plain `<li>` link whose icon is a `<symbol>` in the page's sprite (`si-*` Simple Icons, `logo-*` single-colour site logos, `mdi-*` Material Design Icons; 24×24, `currentColor`). Optional attributes:

- `data-alias`: space-separated short codes the prompt matches first.
- `data-search`: a search URL with `%s`; an alias plus a query (`lc two sum`) opens it.
- `data-also`: more URLs, space-separated, opened in new tabs along with the href. Write `data-tabs` beside it, their count plus one for the href, which the key prints; nothing counts it for you (the plugin did, until it went).

[/cloud](../cloud/CLAUDE.md), [/ipo](../ipo/CLAUDE.md) and [/invest](../invest/CLAUDE.md) were built from the Cloud, IPO, Kite, Coin and Cashflow bookmarks until November 2026, when the user took those (and Downloads) off /start; each page now holds its own list. Cashflow stayed, so its sheet's address is in both /start's page and /invest's.

There is no pinned row: the most used links are the first group, Daily. The groups are four of six links (Daily, Code, Design, Learn), then Prep's two, Finance's two (Invest and IPO, which open [/invest](../invest/CLAUDE.md) and [/ipo](../ipo/CLAUDE.md)) and Fun's four (the last, Downloads, opens [/downloads](../downloads/CLAUDE.md), whose sites are kept in the browser). A group of two is set in half the places of a group of four, so Prep, Finance and Fun fill what two groups of four did and the groups close into a rectangle at every window size with every key taken. Keep that in mind when adding a link or a group (see *Layout*).

**Hooks**: style.css and prompt.js rely on the markup's hooks: `.prompt` with `#q` and `#hint`, and each group a `section.group` holding an `h2` and a `ul.links` of `<a>`s with an `.icon` and a `.name`. Keep those when changing the markup.

- **Legends**: a key prints its short code (`data-alias`) top left and, when it opens several tabs, their count top right, from `data-tabs`. Both are CSS `content` with empty alt text, so screen readers read only the name.
- **Layout**: one grid of key columns (`--cols`). A group takes as many columns as it sets keys to a row: `--six` for a group of six links (any group with a fifth link), `--two` for a group of at most two (Prep, Finance), `--four` for the rest (Fun). The arrangement follows the window's shape:

  | Window | Columns | Rows of groups |
  |---|---|---|
  | under 360px | 2 | each group a row of its own, but Prep and Finance, one key wide and two deep, share one |
  | phones, and from 760px windows narrower than 5:6 | 4 | Daily Code / Design Learn / Prep Finance Fun, groups of six two keys wide and three deep, groups of two one wide and two deep |
  | from 760px and 5:6 or wider | 8 | Daily Code Design Learn (two keys wide, three deep) / Prep Finance Fun (rows of two, two and four) |
  | from 1500px and 3:1 or wider | 16 | all seven in one row: groups of six three wide and two deep, Prep and Finance one wide and two deep, Fun two by two |

  **The arrangements count on four groups of six, then Prep's two, Finance's two and Fun's four** (32 places: 4 × 8, 8 × 4, 16 × 2). A third link in Prep or Finance, a fifth or seventh link elsewhere, or another group leaves holes, so look at every arrangement after changing the groups. The ratios are where the next arrangement starts to give larger keys.
- **Fit**: from 760px the page is sized to the window and centred. `--key`, a key's height, is the largest at which the arrangement fits both ways, up to 160px, and the gaps, icons and type all follow it. The formula's numbers come from the gap ratios, the tallest the prompt and a heading get (47px and 24px), and `--across`, how many keys wide the arrangement's widest row of groups is, gaps and padding included (5.05, 9.75, 18.85), as the comment above it in style.css spells out: change one and the other has to follow, or the page stops fitting. A key is between square and a quarter wider than tall. On a maximised window the page fills about three quarters of the area: 2560 × 945px gives eight columns of 190 × 152px keys, 1536 × 725px eight of 141 × 113px.
- **Smallest**: a key goes down to 80px, the least that holds a name on two lines (the second runs into the key's lower padding); names wrap in keys under about 97px wide. Half a laptop's screen (768 × 725px) gets eight columns of 79 × 80px keys, so the page fits there. In four columns from 760px, only in tall windows where keys are wide, it goes to 72px. "AlgoMonster", the longest word, needs a key about 76px wide with the key's 2px side padding; from 760px every key is wider.

**Prompt**: the header comment in [prompt.js](prompt.js) describes how the prompt matches and ranks. Links open in the same tab because the page is the browser homepage. Set as a browser search engine, `https://souravas.com/start/?q=%s` takes the prompt's queries from the address bar: the page replaces itself with what Enter would open, or, when that opens several tabs (which needs a click or key press), leaves the query in the prompt. **An address in `?q=` also waits for Enter, never opening by itself**: otherwise anyone could write a souravas.com link that lands on a page of theirs. Only the page's own bookmarks, their searches and Google open unasked. Clicking a group heading (a button injected by `prompt.js`) opens the whole group in new tabs; browsers block every tab after the first until the site is allowed pop-ups.

**Offline**: [public/sw.js](../public/sw.js), the service worker the personal pages share, is registered in production by main.js with the scope `/start`. For this page it serves the page from cache and refreshes the cache in the background, so a deploy shows up on the second open. A browser that opened one of the old designs at /start/v1, /start/v2 or /start/v3 keeps that design's worker and cache, and goes on serving it at that address until the worker is unregistered (`chrome://serviceworker-internals` or the browser's site settings); /start itself is unaffected.
