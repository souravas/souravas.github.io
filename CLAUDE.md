# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sourav's portfolio website. Vanilla HTML / CSS / JS built with Vite — no framework. All source lives under `v3/`. GitHub Actions builds the Vite output from `v3/` and deploys directly to GitHub Pages via `actions/deploy-pages`.

**IMPORTANT**: All changes go in `v3/`. There is no root build wrapper.

## Development Commands

All commands run from `v3/`.

```bash
cd v3
npm install
npm run dev       # dev server on http://localhost:3003
npm run build     # production build → v3/dist
npm run preview   # preview the production build
```

## Deployment

Pushes to `main` are built and published by [.github/workflows/deploy.yml](.github/workflows/deploy.yml) — modern `actions/deploy-pages` path, no `gh-pages` package, no manual `dist/` copy step. Pull requests run the build only, without deploying. The workflow also exposes a *Run workflow* button (`workflow_dispatch`).

## Architecture

- **Entry points**: [v3/index.html](v3/index.html) loads [v3/src/main.js](v3/src/main.js), which imports [v3/src/style.css](v3/src/style.css). No framework, no router — everything is one page with anchor sections.
- **Vite build** outputs to `v3/dist/`; that directory is what gets uploaded as the Pages artifact. Assets are hashed; CSS is not code-split.
- **`v3/public/`** is copied verbatim into the build: `CNAME`, favicons, manifest, `robots.txt`, the redirect stubs (`cv.html`, `resume.html`), and `assets/` (images + `resume.pdf`).
- **CSP**: the inline theme bootstrap and JSON-LD scripts in `v3/index.html` are tightened at build time by the `csp-inline-hashes` Vite plugin in [v3/vite.config.js](v3/vite.config.js), which computes SHA-256 hashes for each inline `<script>` and replaces `'unsafe-inline'` in the CSP meta tag. Dev mode keeps `'unsafe-inline'` so HMR works.
- **Sitemap**: emitted by the same `vite.config.js` with the current build date, so `lastmod` never goes stale.
- **404 page**: [v3/404.html](v3/404.html) is a self-contained static page that GitHub Pages serves for unknown routes.

## Site Structure

```
/                 → portfolio (v3/index.html)
/cv, /resume      → meta-refresh redirect to /assets/resume.pdf
                    (static stubs in v3/public/; dev server rewrites
                     /cv → /cv.html via html-routes plugin in vite.config.js)
/sitemap.xml      → generated at build time
```

Local dev: <http://localhost:3003>. Production: <https://souravas.com>.
