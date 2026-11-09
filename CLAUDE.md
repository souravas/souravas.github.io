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
| `/exercises` | `exercises/` | exercise videos as a grid of thumbnails; `index.html` and `style.css`, no script |
| `/pomodoro` | `pomodoro/` | focus and break timers on a dial |
| `/cv`, `/resume` | `public/cv.html`, `public/resume.html` | 301 to `/assets/resume.pdf` from a Cloudflare redirect rule; the stubs meta-refresh there if the rule is gone |
| any unknown route | `public/404.html` | self-contained static 404 |
| `/sitemap.xml`, `/.well-known/security.txt` | build output | see Build |

Every page other than the portfolio is personal: `noindex`, left out of the sitemap, on /start's pure black and tokens, and set in the shared `public/fonts/` (Inter Tight, JetBrains Mono). /exercises and /pomodoro have a "‹ Start" link back, in a 120px gutter on wider screens.

Each personal page keeps the notes that concern only it (content, writing conventions, modules) in a `CLAUDE.md` in its folder: [start/](start/CLAUDE.md), [kannada/](kannada/CLAUDE.md), [code/](code/CLAUDE.md), [exercises/](exercises/CLAUDE.md), [pomodoro/](pomodoro/CLAUDE.md). Claude Code loads one only when it reads a file in that folder, so read it before changing a page from outside its folder (its plugin in vite.config.js, say). Anything that applies to more than one page stays in this file.

`public/` is copied verbatim into the build: `CNAME`, favicons, manifest, `robots.txt`, the redirect stubs, `start-sw.js`, `fonts/` and `assets/` (images, the `og-cover` social card, `resume.pdf`). Browsers cache `fonts/` and the `.webp` images for a year, so a changed one needs a new file name (see Cloudflare).

### Adding a page

1. Create `<name>/index.html`, `main.js` and `style.css`, copying the head (CSP meta, favicons with the current `?v=`, font preloads, `noindex`) and the Cloudflare Web Analytics script before `</body>` from a sibling page.
2. In [vite.config.js](vite.config.js), add it to `rolldownOptions.input` and to both rewrites in the `html-routes` plugin (dev and preview), and update the page lists in the comments above `appType` and `SITEMAP_URLS`.
3. Add it to the Pages table above and to [README.md](README.md).
4. Create `<name>/CLAUDE.md` with the notes that concern only the new page (where its content lives, its writing conventions, its modules, anything easy to break), and add it to the list under the Pages table. Every page gets one, however short; don't add page-specific sections to this file.

## Build ([vite.config.js](vite.config.js))

Plugins, in order:

- `html-routes`: the dev and preview servers mirror GitHub Pages' routing (`/x` → `/x/index.html`, `/cv` → `/cv.html`).
- `build-stamps` (dev too): fills `__BUILD_DATE__`, `__BUILD_YEAR__`, and the whole years since `CAREER_START` (June 2019) as `__YEARS__`, `__YEARS_00__`, `__YEARS_WORD__`, `__YEARS_WORD_CAP__` and `__YEARS_ORDINAL_CAP__`. **Write these tokens, never the number**, wherever copy states the years. The one exception is the social card (`public/assets/og-cover.jpg`/`.webp`), which has the count drawn into it ("7 years") and has to be redrawn when the count changes each June.
- `kannada-note` and `code-docs` (dev too): render the Markdown pages; see [kannada/CLAUDE.md](kannada/CLAUDE.md) and [code/CLAUDE.md](code/CLAUDE.md).
- `json-ld-minify`, `inline-css` (each page's CSS bundle is inlined as a `<style>`, so there is no render-blocking stylesheet request), `csp-inline-hashes`, `html-minify`.
- `sitemap` (lists only `/`, with the build date as `lastmod`), `security-txt` (`Expires` 364 days out, since RFC 9116 wants under a year; contact `SECURITY_CONTACT`), `root-default`.

**CSP**: every page carries a CSP `<meta>`. At build time `csp-inline-hashes` swaps `'unsafe-inline'` for SHA-256 hashes of the page's inline `<script>`s and `<style>`s; dev keeps `'unsafe-inline'` so HMR works. A page with an inline script (v1–v3, /kannada, /pomodoro) has `script-src 'self' 'unsafe-inline'` in its source for that swap; the others have `script-src 'self'`. That literal `'self' 'unsafe-inline'` prefix is what the swap matches, so add other sources after it.

**Analytics**: the eight built pages (v1–v3, /start, /kannada, /code, /exercises, /pomodoro) load Cloudflare Web Analytics (`static.cloudflareinsights.com/beacon.min.js`, just before `</body>`). Its CSP allows that host in `script-src` and `https://cloudflareinsights.com`, where the beacon reports, in `connect-src`.

**Favicons** are shared by every page and linked with a `?v=` query. When the icons change, bump it on every page, `public/404.html` included, or browsers keep showing the cached ones.

## Portfolio (v1–v3)

Each design is self-contained; v2 and v3 bundle their own `fonts/`, and v1 uses `public/fonts/`. All three share the social card and name `/` as their canonical, so search engines index one copy of the résumé, while `og:url` stays per version. The footer's design switcher links the default as `/` and the others as `/vN/`.
