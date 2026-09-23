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

Pushes to `main` are built and published by [.github/workflows/deploy.yml](.github/workflows/deploy.yml) — modern `actions/deploy-pages` path, no `gh-pages` package, no manual `dist/` copy step. Pull requests run the build only, without deploying. The workflow also exposes a *Run workflow* button (`workflow_dispatch`).

## Architecture

- **Three page versions**: [v1/](v1/) is the default design, [v2/](v2/) is the editorial "Systems Ledger" design, [v3/](v3/) is the observability-console "Control Room" design. Each is self-contained: `index.html` + `main.js` + `style.css` (v2 and v3 also bundle their own `fonts/`). No framework, no router — each version is one page with anchor sections.
- **Start page**: a personal bookmarks dashboard at `/start`, with two designs laid out like the portfolio versions. [start/v2/](start/v2/) is the default (build-time copy to `/start`): pure black, v1's shared `public/fonts/`, an inline prompt that filters the links in place, and an "open all" button per group (injected by its `main.js`; browsers block every tab after the first as a pop-up until the site is allowed pop-ups). [start/v1/](start/v1/) is the original static rebuild of a self-hosted Homepage instance: dark slate, its own `fonts/`, a pre-blurred `serenity.webp` backdrop, and a modal quick launch. Bookmarks are plain `<li>` links and icons are `<symbol>`s in each page's inline SVG sprite. The link sets differ: v2 holds the curated learning bookmarks (Daily, Code, System Design, Courses, Fit), while v1 keeps the original Homepage links as they were, so link changes go in v2 only unless asked otherwise. Both are `noindex` and left out of the sitemap.
- **Multi-page Vite build** with `v1/index.html`, `v2/index.html`, `v3/index.html`, `start/v1/index.html`, and `start/v2/index.html` as inputs, output to `dist/`; that directory is what gets uploaded as the Pages artifact. The `root-default` plugin in [vite.config.js](vite.config.js) copies each default page into place (`DEFAULT_PAGES`): built `v1/index.html` → `dist/index.html` and `start/v2/index.html` → `dist/start/index.html`, so `/` serves v1 and `/start` serves start v2. Assets are hashed; each page's CSS bundle is inlined into its HTML by the `inline-css` plugin, so production has no render-blocking stylesheet request.
- **`public/`** is copied verbatim into the build: `CNAME`, favicons, manifest, `robots.txt`, the redirect stubs (`cv.html`, `resume.html`), v1's `fonts/`, and `assets/` (images + `resume.pdf`).
- **CSP**: inline theme bootstraps, JSON-LD scripts, and the inlined stylesheets are tightened at build time by the `csp-inline-hashes` Vite plugin in [vite.config.js](vite.config.js), which computes SHA-256 hashes for each inline `<script>`/`<style>` and replaces `'unsafe-inline'` in the CSP meta tag. Dev mode keeps `'unsafe-inline'` so HMR works.
- **Sitemap**: emitted by the same `vite.config.js` with the current build date, so `lastmod` never goes stale.
- **404 page**: [public/404.html](public/404.html) is a self-contained static page that GitHub Pages serves for unknown routes.

## Site Structure

```
/                 → portfolio, v1 design (default; build-time copy of /v1/)
/v1               → portfolio, v1 design
/v2               → portfolio, v2 design
/v3               → portfolio, v3 design
/start            → start page, v2 design (default; build-time copy of /start/v2/)
/start/v1         → start page, v1 design — Homepage rebuild (noindex)
/start/v2         → start page, v2 design — pure black (noindex)
/cv, /resume      → meta-refresh redirect to /assets/resume.pdf
                    (static stubs in public/; dev server rewrites
                     /cv → /cv.html via html-routes plugin in vite.config.js)
/sitemap.xml      → generated at build time
```

The dev server mirrors production routing: the `html-routes` plugin rewrites `/` → `/v1/index.html`, `/v2` → `/v2/index.html`, `/v3` → `/v3/index.html`, `/start` and `/start/v2` → `/start/v2/index.html`, and `/start/v1` → `/start/v1/index.html`.

Local dev: <http://localhost:5173>. Production: <https://souravas.com>.
