# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sourav's site, <https://souravas.com>: a portfolio in three designs, plus personal pages (a start page, a Kannada course, Python interview notes, exercise videos, a Pomodoro timer). Vanilla HTML / CSS / JS built with Vite — no framework, no router. Each page is one `index.html` with its own `main.js` and `style.css`, and the code comments at the top of each module describe its behaviour in detail.

```bash
npm install
npm run dev       # dev server on http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview the production build
```

## Deployment

- [.github/workflows/deploy.yml](.github/workflows/deploy.yml) builds pushes and pull requests to `main`, and deploys pushes (and *Run workflow*) to GitHub Pages with `actions/deploy-pages`. Pull requests only build. The upload sets `include-hidden-files: true`: without it `upload-pages-artifact` drops dot-folders, and `/.well-known/security.txt` never ships.
- [.github/workflows/rebuild.yml](.github/workflows/rebuild.yml) starts that workflow on the 1st of each month, so the build-time values roll over without a push. It is its own file because GitHub switches off a scheduled workflow after 60 days without repository activity, and that must never stop deploys on push.
- Dependabot opens weekly npm and Actions update PRs.

### Cloudflare

The domain is registered at Cloudflare and its DNS is there. The site's records (the apex's four GitHub Pages `A` and four `AAAA` records, and `www` as a `CNAME` to `souravas.github.io`) are proxied, with SSL/TLS on Full (strict). GitHub keeps its own Let's Encrypt certificate behind the proxy; renewals get through because Cloudflare passes `/.well-known/acme-challenge/` to GitHub over plain HTTP. A Cloudflare 526 error means that certificate lapsed: set the records to DNS only until GitHub renews it. Mail runs through SimpleLogin (MX, SPF, DKIM `CNAME`s, and DMARC reporting to Cloudflare's DMARC Management), so Cloudflare Email Routing stays off.

- **No HTML rewriting.** Pages must reach visitors byte for byte as GitHub serves them, because `csp-inline-hashes` pins every inline script and style. So these stay off: Email Address Obfuscation, Automatic HTTPS Rewrites, Rocket Loader, Bot Fight Mode (its JavaScript Detections inject an inline script the CSP blocks) and Web Analytics' automatic setup (the pages load the beacon themselves). To check, compare `curl -s https://souravas.com/v1/` with `curl -s --resolve souravas.com:443:185.199.108.153 https://souravas.com/v1/`.
- **Headers**: the Managed Transform *Add security headers* adds `x-content-type-options`, `x-frame-options` and `referrer-policy`. GitHub's HSTS passes through.
- **Caching**: Browser Cache TTL respects GitHub's `max-age=600`. The cache rule *Hashed build files* gives `.js`, `.css` and `.woff2` under `/assets/` a year at the edge and in browsers. The cache rule *Fixed-name fonts and images* gives `/fonts/` and the `.webp` files in `/assets/` (except `og-cover`) a year in browsers, while the edge keeps GitHub's 10 minutes. **So never replace one of those files in place**: save the new version under a new name and update every reference, including the `profile.webp` URLs in v1–v3's JSON-LD. `og-cover` and `resume.pdf` keep their names and their 10 minutes.
- **Redirects**: the redirect rule *CV to PDF* sends `/cv`, `/cv.html`, `/resume` and `/resume.html` to `/assets/resume.pdf` with a 301, so the `public/` stubs answer only if the rule is removed.
- Search, agent and training crawlers are all allowed, and Cloudflare leaves `robots.txt` as it is.

## Pages

| Route | Source | What it is |
|---|---|---|
| `/` | `v1/` | the default design; the `root-default` plugin copies built `v1/index.html` to `dist/index.html` (`DEFAULT_PAGES`) |
| `/v1`, `/v2`, `/v3` | `v1/`, `v2/`, `v3/` | portfolio designs: Editorial, Systems Ledger, Control Room |
| `/start` | `start/` | bookmarks dashboard, the browser homepage |
| `/kannada` | `kannada/` | *Kannada Gottilla*, a spoken-Kannada course rendered from `kannada/note.md` |
| `/kannada/anki.txt` | build output | the course's cards as an Anki deck |
| `/code` | `code/` | Python interview references rendered from the Markdown in `code/` |
| `/exercises` | `exercises/` | exercise video links; `index.html` and `style.css`, no script |
| `/pomodoro` | `pomodoro/` | focus and break timers on a dial |
| `/cv`, `/resume` | `public/cv.html`, `public/resume.html` | 301 to `/assets/resume.pdf` from a Cloudflare redirect rule; the stubs meta-refresh there if the rule is gone |
| any unknown route | `public/404.html` | self-contained static 404 |
| `/sitemap.xml`, `/.well-known/security.txt` | build output | see Build |

Every page other than the portfolio is personal: `noindex`, left out of the sitemap, on /start's pure black and tokens, and set in the shared `public/fonts/` (Inter Tight, JetBrains Mono). /exercises and /pomodoro have a "‹ Start" link back, in a 120px gutter on wider screens.

`public/` is copied verbatim into the build: `CNAME`, favicons, manifest, `robots.txt`, the redirect stubs, `start-sw.js`, `fonts/` and `assets/` (images, the `og-cover` social card, `resume.pdf`). Browsers cache `fonts/` and the `.webp` images for a year, so a changed one needs a new file name (see Cloudflare).

### Adding a page

1. Create `<name>/index.html`, `main.js` and `style.css`, copying the head (CSP meta, favicons with the current `?v=`, font preloads, `noindex`) and the Cloudflare Web Analytics script before `</body>` from a sibling page.
2. In [vite.config.js](vite.config.js), add it to `rolldownOptions.input` and to both rewrites in the `html-routes` plugin (dev and preview), and update the page lists in the comments above `appType` and `SITEMAP_URLS`.
3. Add it to the Pages table above and to [README.md](README.md).

## Build ([vite.config.js](vite.config.js))

Plugins, in order:

- `html-routes`: the dev and preview servers mirror GitHub Pages' routing (`/x` → `/x/index.html`, `/cv` → `/cv.html`).
- `build-stamps` (dev too): fills `__BUILD_DATE__`, `__BUILD_YEAR__`, and the whole years since `CAREER_START` (June 2019) as `__YEARS__`, `__YEARS_00__`, `__YEARS_WORD__`, `__YEARS_WORD_CAP__` and `__YEARS_ORDINAL_CAP__`. **Write these tokens, never the number**, wherever copy states the years. The one exception is the social card (`public/assets/og-cover.jpg`/`.webp`), which has the count drawn into it ("7 years") and has to be redrawn when the count changes each June.
- `kannada-note` and `code-docs` (dev too): render the Markdown pages; see /kannada and /code below.
- `json-ld-minify`, `inline-css` (each page's CSS bundle is inlined as a `<style>`, so there is no render-blocking stylesheet request), `csp-inline-hashes`, `html-minify`.
- `sitemap` (lists only `/`, with the build date as `lastmod`), `security-txt` (`Expires` 364 days out, since RFC 9116 wants under a year; contact `SECURITY_CONTACT`), `root-default`.

**CSP**: every page carries a CSP `<meta>`. At build time `csp-inline-hashes` swaps `'unsafe-inline'` for SHA-256 hashes of the page's inline `<script>`s and `<style>`s; dev keeps `'unsafe-inline'` so HMR works. A page with an inline script (v1–v3, /kannada, /pomodoro) has `script-src 'self' 'unsafe-inline'` in its source for that swap; the others have `script-src 'self'`. That literal `'self' 'unsafe-inline'` prefix is what the swap matches, so add other sources after it.

**Analytics**: the eight built pages (v1–v3, /start, /kannada, /code, /exercises, /pomodoro) load Cloudflare Web Analytics (`static.cloudflareinsights.com/beacon.min.js`, just before `</body>`). Its CSP allows that host in `script-src` and `https://cloudflareinsights.com`, where the beacon reports, in `connect-src`.

**Favicons** are shared by every page and linked with a `?v=` query. When the icons change, bump it on every page, `public/404.html` included, or browsers keep showing the cached ones.

## Portfolio (v1–v3)

Each design is self-contained; v2 and v3 bundle their own `fonts/`, and v1 uses `public/fonts/`. All three share the social card and name `/` as their canonical, so search engines index one copy of the résumé, while `og:url` stays per version. The footer's design switcher links the default as `/` and the others as `/vN/`.

## /start

[start/index.html](start/index.html) owns the groups, the links and their order; don't copy them into this file. A bookmark is a plain `<li>` link whose icon is a `<symbol>` in the page's inline SVG sprite (`si-*` Simple Icons, `logo-*` single-colour site logos, `mdi-*` Material Design Icons; 24×24, `currentColor`). Optional attributes:

- `data-alias`: space-separated short codes the prompt matches first.
- `data-search`: a search URL with `%s`; an alias plus a query (`lc two sum`) opens it.
- `data-also`: more URLs, space-separated, opened in new tabs along with the href.

The most used links are pinned above the groups in `ul.links.top`, as tiles across the page with their names; they belong to no group. Now, the bolt at the prompt's end (or `now` typed into it), opens every pinned link in new tabs in page order, so pinning a link adds it to Now. The bolt is `hidden` in the markup until `main.js` finds a pinned link.

The header comment in [start/main.js](start/main.js) describes how the prompt matches and ranks. Links open in the same tab because the page is the browser homepage. Set as a browser search engine, `https://souravas.com/start/?q=%s` takes the prompt's queries from the address bar: the page replaces itself with what Enter would open, or, when that opens several tabs (which needs a click or key press), leaves the query in the prompt. Clicking a group heading (a button injected by `main.js`) opens the whole group in new tabs; browsers block every tab after the first until the site is allowed pop-ups.

**Layout**: below 760px the pinned tiles sit three to a row and the groups stack in one column, each with its links in two columns. From 760px the tiles make one row and the groups run in four newspaper-style columns that the browser balances. The most used groups come first, so they sit on the left: Plan, Code and Practice, then Design and Learn, then Read, Media and Fitness, then Finance and Social, an order that also makes the four columns end close together. After moving a group or adding links, check where the columns end. Rows and gaps grow with the window's height, and the page fits without scrolling in a window about 870px tall.

[public/start-sw.js](public/start-sw.js) is registered by `main.js` in production with scope `/start`. It serves `/start` and `/start/` from cache and refreshes the cache in the background, so a deploy shows up on the second open.

## /kannada

- **Content**: [kannada/note.md](kannada/note.md) is the course and its only copy, so edit it here. `70 - Learn/Language/Kannada Gottilla.md` in the `hope` Obsidian vault holds only frontmatter and a link to this page, so never copy it over note.md.
- **Writing conventions**: 89 lessons, with checkpoints at 33, 69 and 89. Beginner lessons (1–32) are trimmed to a day's lines. Look-up tables, extra examples and written forms go under a `> [!later]- For later` fold rather than being deleted. Each lesson ends on a `> [!say] Say it today` callout, a one-row English and Kannada table.
- **Rendering**: the `kannada-note` plugin runs [kannada/render.js](kannada/render.js) (build-time only) into `index.html` at its `<!--note-->`, `<!--lessons-->` and `<!--cards-->` markers. Dev reloads when the note is saved, and the plugin warns about any `#` link that lands on no id, such as a renamed heading. render.js reads only the Markdown the note uses: headings, pipe tables, lists, callouts (folded ones become `<details>`), code, bold, italics, links and wiki-links (`[[#Heading|alias]]`; a link to another vault note opens through `obsidian://open?vault=hope`). Ids: a `#` heading opens a `section.part`, `## Lesson N — Title` a `section.lesson` with id `lesson-N`, and a heading inside a lesson gets a `lesson-N-…` id.
- **Kannada text** is set in JetBrains Mono, because Inter Tight draws `I` and `l` alike and the notation's capitals mark sounds (`iddIra`). Which table columns are English is set by `ENGLISH_COLUMNS` in render.js.
- **Cards**: render.js builds them from the lessons' own tables, one card per row and Kannada column. It leaves out exercise tables (the ones an Answers callout follows), cells with backticks, `SKIP_COLUMNS` and lines over 140 characters. Tables in `[!later]` folds become drill-only cards. Checkpoints have no quiz; their exercises get a "Run as cards" button built from the answers (`checkCards`). A card's id is a hash of its English and Kannada. The cards go to `/kannada/cards.<hash>.json`, named in the page's `<meta name="cards">`, and to `/kannada/anki.txt` (`ankiDeck`). The Anki deck uses each card's id as its GUID, so importing it again updates the cards instead of duplicating them.
- **Speech**: with a `kn` voice on the device, [kannada/speech.js](kannada/speech.js) marks the root `can-speak` and Kannada becomes tappable. [kannada/script.js](kannada/script.js) converts the note's spelling into Kannada script for the voice. **Every English word or name used in a Kannada line must be listed in its `ENGLISH` or `NAMES` list**, or the voice reads it as Kannada. `SAID_AS` holds the names the note respells.
- **Modules**: `main.js` (bar, Lessons sheet, Cover, lesson on screen), `today.js` (the Today view: the day's checklist and only the current lesson), `deck.js` (the quiz `<dialog>`), `cards.js` (loads the cards file), `store.js` (localStorage key `kannada`: Leitner boxes `INTERVALS`, `NEW_PER_DAY`, lesson progress; the page works without it).
- **First paint**: an inline script in the head adds `is-today` to the root before paint, and the note stays invisible until today.js adds `is-ready` (CSS shows it after 3s if the script fails).
- **`content-visibility: auto`** is set on each lesson. Measuring anything inside a skipped lesson forces it to lay out, so main.js finds the lesson on screen by measuring the `section.lesson` elements, never their headings.

## /code

- **Content**: [code/PATTERNS.md](code/PATTERNS.md) (algorithm templates), [code/CHEATSHEET.md](code/CHEATSHEET.md) (syntax and idioms, no algorithms) and [code/README.md](code/README.md) (the Overview: the solution trees, how to run them, interview-day tips) are the only copies. The solutions stay in the `souravas/code` repo, whose README and the vault's `70 - Learn/Code/Python Code.md` just link here.
- **Writing conventions**: between them, Patterns and Cheatsheet cover every technique in the solutions. Put new material on the right side of the line between them, and give a problem its own subsection only if it shows something its template doesn't. They're read on a phone under time pressure: keep code blocks self-contained and prose short, and explain a non-obvious step in a comment on that step. The longest code line (93 characters) fits unwrapped from 900px; below that, code wraps under its indent. Adding or renaming a `##` heading means updating the document's Table of Contents and any links to it.
- **Links**: keep plain file links with GitHub's anchors (`PATTERNS.md#fast--slow-pointers`). The page uses the same anchors as ids, so a link works both here and on GitHub. In a code comment, `PATTERNS.md → Sorting` becomes a link.
- **Rendering**: the `code-docs` plugin runs [code/render.js](code/render.js) (build-time only) into `index.html` at its `<!--docs-->` and `<!--sections-->` markers. It highlights the Python at build time, reloads dev when a document is saved, and warns about dead `#` links. Supported Markdown: headings, pipe tables, lists, fenced and inline code, bold, italics, links.
- **Code blocks**: each line is a `.l` span (indent `.w`, code `.x`, end comment `.t`; `.e` and `.a` for a line with an end comment). Each line keeps its newline in the text, so a block's `textContent` is exactly its source; Copy, search and hand selection depend on that.
- **Modules**: `main.js` (section on screen, Sections sheet, Cover, Copy) and [code/search.js](code/search.js), which searches the page's own DOM, so nothing is downloaded.
- Each `##` section is `content-visibility: auto`, with render.js's estimate of its height in `data-h`. As on /kannada, main.js finds the section on screen by measuring the sections, never what is inside them.
- It is a reference, not a course, so it has no quizzes or review.

## /pomodoro

- [pomodoro/main.js](pomodoro/main.js) runs the timer and the Settings sheet. A running timer counts down to a moment (`endsAt`) and ends on one `setTimeout` set when it starts, never chained off the display's ticks, so a throttled background tab still ends on time.
- [pomodoro/sound.js](pomodoro/sound.js) makes every sound with Web Audio, with no audio files. The levels were measured in the browser: at volume 100 the alarms peak near full scale without clipping, and the start sounds at about half that; match those when adding a sound. A page can only make sound after a tap or a key press.
- [pomodoro/themes.js](pomodoro/themes.js) holds Black (whose tokens are also the stylesheet's `:root` defaults) and published palettes. A theme's two starting colours must read at 4.5:1 or better on its ground and on their own tint. Its grey for quiet text is lifted only where it reads under 4.5:1.
- localStorage keeps the timer under `pomodoro` and the settings under `pomodoro-settings`, including the theme's tokens as `paint`, which an inline script in the head applies before first paint. The page works without storage.
