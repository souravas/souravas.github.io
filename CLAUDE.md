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

- **Two page versions**: [v1/](v1/) is the default design, [v2/](v2/) is the newer design. Each is self-contained: `index.html` + `main.js` + `style.css` (v2 also bundles its own `fonts/`). No framework, no router — each version is one page with anchor sections.
- **Multi-page Vite build** with `v1/index.html` and `v2/index.html` as inputs, output to `dist/`; that directory is what gets uploaded as the Pages artifact. The `root-default` plugin in [vite.config.js](vite.config.js) copies the built `v1/index.html` to `dist/index.html`, so `/` serves v1 by default. Assets are hashed; each page's CSS bundle is inlined into its HTML by the `inline-css` plugin, so production has no render-blocking stylesheet request.
- **`public/`** is copied verbatim into the build: `CNAME`, favicons, manifest, `robots.txt`, the redirect stubs (`cv.html`, `resume.html`), v1's `fonts/`, and `assets/` (images + `resume.pdf`).
- **CSP**: inline theme bootstraps, JSON-LD scripts, and the inlined stylesheets are tightened at build time by the `csp-inline-hashes` Vite plugin in [vite.config.js](vite.config.js), which computes SHA-256 hashes for each inline `<script>`/`<style>` and replaces `'unsafe-inline'` in the CSP meta tag. Dev mode keeps `'unsafe-inline'` so HMR works.
- **Sitemap**: emitted by the same `vite.config.js` with the current build date, so `lastmod` never goes stale.
- **404 page**: [public/404.html](public/404.html) is a self-contained static page that GitHub Pages serves for unknown routes.

## Site Structure

```
/                 → portfolio, v1 design (default; build-time copy of /v1/)
/v1               → portfolio, v1 design
/v2               → portfolio, v2 design
/cv, /resume      → meta-refresh redirect to /assets/resume.pdf
                    (static stubs in public/; dev server rewrites
                     /cv → /cv.html via html-routes plugin in vite.config.js)
/sitemap.xml      → generated at build time
```

The dev server mirrors production routing: the `html-routes` plugin rewrites `/` → `/v1/index.html` and `/v2` → `/v2/index.html`.

Local dev: <http://localhost:5173>. Production: <https://souravas.com>.
