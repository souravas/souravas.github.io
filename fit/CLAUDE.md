# /fit

- [index.html](index.html) has two groups in the order done: the warm-up (full-body warm-up, jump rope), then the exercises. Each `<ol>` numbers its own from 1.
- Each video is a link to YouTube, opened in the same tab as on /start, holding its thumbnail (`i.ytimg.com/vi_webp/<id>/sddefault.webp`, which the CSP allows in `img-src`). A Short keeps its `/shorts/` link; its thumbnail is the same 4:3 file. Keep `&t=` off the links, so every video starts at the beginning.
- The thumbnails sit two across on phones. From 760px they are sized to the window as /start's keys are: as wide as lets the whole page fit, 160–400px, with the gaps, type and play mark following. The window's shape picks the arrangement (2, 3 or 4 across with each group's heading in the 120px gutter; from 2:1 the warm-up as a column beside the exercises, the way back above the title). The table and the formula are in style.css's *Fit* comment. A maximised window gives 400 × 225px thumbnails at 2560 × 945 and 274 × 154px at 1536 × 725.
- **The arrangements count on two warm-ups and seven exercises** (`--rows`). An eighth exercise fits as it is; any other change to the groups means recounting the rows in each arrangement, or the page stops fitting the window.
- The only personal page without the service worker: offline it would have neither its thumbnails nor its videos, which are YouTube's.
