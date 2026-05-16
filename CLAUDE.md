# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sourav's portfolio website. All source lives under `v3/`. GitHub Actions builds Vite output from `v3/` and deploys directly to GitHub Pages via `actions/deploy-pages`.

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

Pushes to `main` are built and published by `.github/workflows/deploy.yml` (modern `actions/deploy-pages` path — no `gh-pages` package, no manual `dist/` copy step). Pull requests run the build only, without deploying.

## Architecture

- **Vite build** outputs to `v3/dist/`; that directory is what gets uploaded as the Pages artifact.
- **`v3/public/CNAME`** carries the custom domain and is emitted untouched into the build.
- **CSP**: the inline theme bootstrap and JSON-LD scripts in `v3/index.html` are tightened at build time by a small Vite plugin in `v3/vite.config.js` that computes SHA-256 hashes for each inline `<script>` and replaces `'unsafe-inline'` in the CSP meta tag. Dev mode keeps `'unsafe-inline'` so HMR works.
- **Sitemap**: emitted by the same `vite.config.js` with the current build date, so `lastmod` never goes stale.

## Site Structure

```
Production URL:
/                 → portfolio
/cv, /resume      → redirect to /assets/resume.pdf

Local Development:
localhost:3003    → v3 dev server
```
