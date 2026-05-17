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

- **Entry points**: [index.html](index.html) loads [src/main.js](src/main.js), which imports [src/style.css](src/style.css). No framework, no router — everything is one page with anchor sections.
- **Vite build** outputs to `dist/`; that directory is what gets uploaded as the Pages artifact. Assets are hashed; CSS is not code-split.
- **`public/`** is copied verbatim into the build: `CNAME`, favicons, manifest, `robots.txt`, the redirect stubs (`cv.html`, `resume.html`), and `assets/` (images + `resume.pdf`).
- **CSP**: the inline theme bootstrap and JSON-LD scripts in [index.html](index.html) are tightened at build time by the `csp-inline-hashes` Vite plugin in [vite.config.js](vite.config.js), which computes SHA-256 hashes for each inline `<script>` and replaces `'unsafe-inline'` in the CSP meta tag. Dev mode keeps `'unsafe-inline'` so HMR works.
- **Sitemap**: emitted by the same `vite.config.js` with the current build date, so `lastmod` never goes stale.
- **404 page**: [404.html](404.html) is a self-contained static page that GitHub Pages serves for unknown routes.

## Site Structure

```
/                 → portfolio (index.html)
/cv, /resume      → meta-refresh redirect to /assets/resume.pdf
                    (static stubs in public/; dev server rewrites
                     /cv → /cv.html via html-routes plugin in vite.config.js)
/sitemap.xml      → generated at build time
```

Local dev: <http://localhost:5173>. Production: <https://souravas.com>.
