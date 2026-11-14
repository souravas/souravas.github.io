# /fit

- [index.html](index.html) has two groups in the order done: the warm-up (full-body warm-up, jump rope), then the exercises. Each `<ol>` numbers its own from 1.
- Each video is a link to YouTube, opened in the same tab as on /start, holding its thumbnail (`i.ytimg.com/vi_webp/<id>/sddefault.webp`, which the CSP allows in `img-src`). A Short keeps its `/shorts/` link; its thumbnail is the same 4:3 file. Keep `&t=` off the links, so every video starts at the beginning.
- The thumbnails sit two across on phones, three from 760px and four from 1100px, where the whole page fits a window about 870px tall. Wider than 760px, each group's heading sits in the 120px gutter beside its grid.
- The only personal page without the service worker: offline it would have neither its thumbnails nor its videos, which are YouTube's.
