# /start/v2 — Keypad

/start's default design since November 2026 (see [../CLAUDE.md](../CLAUDE.md), *The default*): every bookmark a key, each group a block of keys under its name, the blocks closing into one rectangle sized to the window. The build copies this page to /start, so a change here shows at both addresses. [index.html](index.html) is only a head and a `<!--bookmarks-->` marker, which the `start-bookmarks` plugin fills with [../bookmarks.html](../bookmarks.html), so **bookmarks are changed there, never here**. [main.js](main.js) imports /start's prompt (`../prompt.js`) and registers `/sw.js` with the scope of the address it was opened at (`/start/v2`, or `/start` for the copy), which serves the page from cache at once. Only [style.css](style.css) is this page's own.

- **Legends**: a key prints its short code (`data-alias`) top left and, when it opens several tabs, their count top right, from `data-tabs`, which the plugin adds (the URLs in `data-also` plus the href). Both are CSS `content` with empty alt text, so screen readers read only the name.
- **Layout**: one grid of key columns (`--cols`). A group takes as many columns as it sets keys to a row: `--six` for a group of six links (any group with a fifth link), `--four` for a group of four. The arrangement follows the window's shape, and in each one the seven groups close into a rectangle with no key's place left empty:

  | Window | Columns | Rows of groups |
  |---|---|---|
  | under 360px | 2 | each group a row of its own |
  | phones | 4 | Daily Learn / Code Design / Prep Finance / Fun, the last as one row of four |
  | from 760px | 6 | Daily Learn / Code Design / Prep Finance Fun |
  | from 900px and 23:20 or wider | 9 | Daily Learn Code / Design Prep Finance Fun |
  | from 1200px and 23:10 or wider | 12 | Daily Learn Code Design / Prep Finance Fun, the three of four each one row |

  **The rectangles count on four groups of six and three of four** (36 keys: 6 × 6, 9 × 4, 12 × 3). Another group, or a group of another size, leaves a hole somewhere, so look at all five arrangements after changing the groups. The ratios are where the next arrangement starts to give larger keys.
- **Fit**: from 760px the page is sized to the window and centred. `--key`, a key's height, is the largest at which the arrangement fits both ways, up to 160px, and the gaps, icons and type all follow it. The formula's numbers come from the gap ratios and the tallest the prompt and a heading get (47px and 24px), as the comment above it in style.css spells out: change one and the other has to follow, or the page stops fitting. A key is between square and a quarter wider than tall. On a maximised window the page fills about three quarters of the area: 2560 × 945px gives twelve columns of 185 × 160px keys, 1536 × 725px nine columns of 141 × 113px.
- **Smallest**: a key goes down to 80px, the least that holds a name on two lines (the second runs into the key's lower padding); names wrap in keys under about 97px wide. In six columns it goes to 72px, where the keys stay 100px wide and no name wraps, so half a laptop's screen (768 × 725px) holds the page. Below that a window scrolls: under about 440px of height in twelve columns, 525px in nine, 680px in six. "AlgoMonster", the longest word, needs a key 79px wide; from 760px every key is wider.
