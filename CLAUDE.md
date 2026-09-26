# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sourav's portfolio website. Vanilla HTML / CSS / JS built with Vite — no framework. GitHub Actions builds the Vite output and deploys directly to GitHub Pages via `actions/deploy-pages`.

## Development Commands

```bash
npm install
npm run dev       # dev server on http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview the production build
```

## Deployment

Pushes to `main` are built and published by [.github/workflows/deploy.yml](.github/workflows/deploy.yml) — modern `actions/deploy-pages` path, no `gh-pages` package, no manual `dist/` copy step. Pull requests run the build only, without deploying. The workflow also exposes a *Run workflow* button (`workflow_dispatch`). [.github/workflows/rebuild.yml](.github/workflows/rebuild.yml) starts that workflow on the 1st of each month, so the build-time values below roll over without a push; the schedule lives in its own file because GitHub switches off a scheduled workflow after 60 days without repository activity, and that must never stop deploys on push.

## Architecture

- **Four page versions**: [v1/](v1/) is the default design, "Editorial". [v2/](v2/) is the editorial "Systems Ledger" design, [v3/](v3/) the observability-console "Control Room" design, and [v4/](v4/) the "Plain" design (one Newsreader serif column with hairline rules, no effects, nothing hidden behind JS, and a print stylesheet that turns it into a CV). Each is self-contained: `index.html` + `main.js` + `style.css` (v2, v3 and v4 also bundle their own `fonts/`). v4 has its own social card, `public/assets/og-cover-v4.jpg` + `.webp`, set in its type; v1–v3 share `og-cover`. Every version names `/` as its canonical, so search engines index one copy of the résumé, while `og:url` stays per version so each shares with its own card. The footer's design switcher links the default as `/` and the others as `/vN/`. No framework, no router — each version is one page with anchor sections.
- **Start page**: a personal bookmarks dashboard at `/start`, with two designs laid out like the portfolio versions. [start/v2/](start/v2/) is the default (build-time copy to `/start`): pure black, v1's shared `public/fonts/`, a motivational quote above the prompt (the Homepage greeting's quotes, kept as `<li>`s in its `index.html`; `main.js` shows a random one and swaps it every three minutes), an inline prompt that filters the links in place (by alias, then link name with word starts ranked first, then site name; Enter opens the best match, Ctrl/⌘+Enter in a new tab; an alias plus a query, like `lc two sum`, opens that link's search), and clickable group headings that open every link in the group (the heading button is injected by its `main.js`; browsers block every tab after the first as a pop-up until the site is allowed pop-ups). It is the browser homepage, so links open in the same tab, and [public/start-sw.js](public/start-sw.js), a service worker registered by its `main.js` in production with scope `/start`, serves `/start` and `/start/` from cache (instant and offline) and refreshes the cache in the background, so a deploy shows up on the second open (the unhashed shared `/fonts/` are revalidated by ETag on each refresh). On phones the links run in two columns to keep the page short; a group heading there takes about as much height as a row of links. [start/v1/](start/v1/) is the original static rebuild of a self-hosted Homepage instance: dark slate, its own `fonts/`, a pre-blurred `serenity.webp` backdrop, and a modal quick launch. Bookmarks are plain `<li>` links and icons are `<symbol>`s in each page's inline SVG sprite. In v2 a link's optional `data-alias` holds its short codes (named in the prompt's hint on hover) and `data-search` a search URL with `%s` for the query. The link sets differ: v2 holds the curated learning bookmarks (Tools, Plan, Code, Design, Learn, Fit, Play), while v1 keeps the original Homepage links as they were, so link changes go in v2 only unless asked otherwise. v2's groups say what their links are, never how often they're opened, so a new link joins the group it belongs to rather than a catch-all like the old Daily; Play stays last, below the work. Both are `noindex` and left out of the sitemap.
- **Multi-page Vite build** with `v1/index.html`, `v2/index.html`, `v3/index.html`, `v4/index.html`, `start/v1/index.html`, and `start/v2/index.html` as inputs, output to `dist/`; that directory is what gets uploaded as the Pages artifact. The `root-default` plugin in [vite.config.js](vite.config.js) copies each default page into place (`DEFAULT_PAGES`): built `v1/index.html` → `dist/index.html` and `start/v2/index.html` → `dist/start/index.html`, so `/` serves v1 and `/start` serves start v2. Assets are hashed; each page's CSS bundle is inlined into its HTML by the `inline-css` plugin, so production has no render-blocking stylesheet request.
- **`public/`** is copied verbatim into the build: `CNAME`, favicons, manifest, `robots.txt`, the redirect stubs (`cv.html`, `resume.html`), the `/start` service worker (`start-sw.js`), v1's `fonts/`, and `assets/` (images + `resume.pdf`). The favicons (`favicon.svg` with its PNG/ICO renders, plus the full-bleed `icon-maskable.svg` that `apple-touch-icon.png` is rendered from) are shared by every page and linked with a `?v=` query: bump it on every page, `404.html` included, when the icons change, or browsers keep showing the cached ones.
- **CSP**: inline theme bootstraps, JSON-LD scripts, and the inlined stylesheets are tightened at build time by the `csp-inline-hashes` Vite plugin in [vite.config.js](vite.config.js), which computes SHA-256 hashes for each inline `<script>`/`<style>` and replaces `'unsafe-inline'` in the CSP meta tag. Dev mode keeps `'unsafe-inline'` so HMR works.
- **Build-time values**, all in [vite.config.js](vite.config.js): the `build-stamps` plugin fills tokens in every page, in dev as well as the build — `__BUILD_DATE__`, `__BUILD_YEAR__`, and the years since the career began in June 2019 (`CAREER_START`) as `__YEARS__` (7), `__YEARS_00__` (07), `__YEARS_WORD__` (seven), `__YEARS_WORD_CAP__` (Seven) and `__YEARS_ORDINAL_CAP__` (Seventh). Write those tokens, never the number, wherever copy states the years. The one exception is `og-cover.jpg`/`.webp` (v1–v3's card), which has "7 years" drawn into it. The sitemap lists only `/`, with the build date as `lastmod`, and `/.well-known/security.txt` is emitted with an `Expires` 364 days out (RFC 9116 wants less than a year); its contact address is `SECURITY_CONTACT`.
- **404 page**: [public/404.html](public/404.html) is a self-contained static page that GitHub Pages serves for unknown routes.

## Site Structure

```
/                 → portfolio, v1 design (default; build-time copy of /v1/)
/v1               → portfolio, v1 design
/v2               → portfolio, v2 design
/v3               → portfolio, v3 design
/v4               → portfolio, v4 design
/start            → start page, v2 design (default; build-time copy of /start/v2/)
/start/v1         → start page, v1 design — Homepage rebuild (noindex)
/start/v2         → start page, v2 design — pure black (noindex)
/cv, /resume      → meta-refresh redirect to /assets/resume.pdf
                    (static stubs in public/; dev server rewrites
                     /cv → /cv.html via html-routes plugin in vite.config.js)
/sitemap.xml      → generated at build time
/.well-known/security.txt → generated at build time
```

The dev server mirrors production routing: the `html-routes` plugin rewrites `/` and `/v1` → `/v1/index.html`, `/v2` → `/v2/index.html`, `/v3` → `/v3/index.html`, `/v4` → `/v4/index.html`, `/start` and `/start/v2` → `/start/v2/index.html`, and `/start/v1` → `/start/v1/index.html`.

Local dev: <http://localhost:5173>. Production: <https://souravas.com>.
