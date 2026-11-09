# Sourav's Portfolio

Source for [souravas.com](https://souravas.com). Vanilla HTML / CSS / JS built with Vite — no framework. GitHub Actions builds and deploys to GitHub Pages on every push to `main`.

## Getting Started

```bash
npm install
npm run dev       # dev server on http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview the production build
```

## Deployment

Pushes to `main` are built and deployed automatically via [.github/workflows/deploy.yml](.github/workflows/deploy.yml) using `actions/deploy-pages`. Pull requests run the build only. To trigger a deploy manually, use *Run workflow* on the Actions tab. [.github/workflows/rebuild.yml](.github/workflows/rebuild.yml) redeploys on the 1st of each month, so the values filled in at build time (years of experience, the `security.txt` expiry) stay current without a push.

The domain and its DNS are on Cloudflare, which proxies the site in front of GitHub Pages: it adds security headers, caches the fonts and images for a year, and redirects `/cv` and `/resume`. It is set not to rewrite any HTML, since each page's CSP pins its inline scripts and styles by hash. [CLAUDE.md](CLAUDE.md#cloudflare) lists the settings.

## URLs

- Local dev: <http://localhost:5173>
- Production: <https://souravas.com>
- Page versions: `/` serves v1 by default; `/v1`, `/v2`, and `/v3` open each design explicitly, and each names `/` as its canonical
- Start page: `/start` — personal bookmarks dashboard (noindex)
- Kannada: `/kannada` — the Kannada Gottilla lessons note as a page (noindex), rendered from `kannada/note.md` at build time
- Code: `/code` — the Python interview references as a page (noindex), rendered from the Markdown in `code/` at build time
- Exercises: `/exercises` — exercise videos behind the start page's Exercise link (noindex)
- Pomodoro: `/pomodoro` — focus and break timers on a dial (noindex)
- Resume redirects: `/cv`, `/resume` → `/assets/resume.pdf`
- Sitemap: `/sitemap.xml`, generated at build time
- Security contact: `/.well-known/security.txt`, generated at build time

## Project Structure

```
souravas.github.io/
├── v1/                     # "Editorial" design, the default (also served at /)
│   ├── index.html
│   ├── main.js
│   └── style.css
├── v2/                     # "Systems Ledger" design, served at /v2
│   ├── index.html
│   ├── main.js
│   ├── style.css
│   └── fonts/
├── v3/                     # "Control Room" design, served at /v3
│   ├── index.html
│   ├── main.js
│   ├── style.css
│   └── fonts/
├── start/                  # personal start page, served at /start
│   ├── index.html          # bookmarks + inline SVG icon sprite
│   ├── main.js             # type-anywhere prompt that filters the links
│   └── style.css
├── kannada/                # Kannada lessons, served at /kannada
│   ├── index.html          # page shell: title, bar, lessons sheet
│   ├── note.md             # the lessons note, edited here: the page's content
│   ├── render.js           # note.md → HTML, cards and Anki deck, run at build time by vite.config.js
│   ├── main.js             # lesson on screen, lessons sheet, Cover
│   ├── today.js            # the Today view: the day's plan and current lesson
│   ├── deck.js             # quizzes and the review
│   ├── cards.js            # loads the cards file
│   ├── store.js            # progress and Leitner review, in localStorage
│   ├── speech.js           # the device's Kannada voice
│   ├── script.js           # the note's spelling → Kannada script
│   └── style.css
├── code/                   # Python interview references, served at /code
│   ├── index.html          # page shell: title, bar, sections sheet, search
│   ├── PATTERNS.md         # algorithm templates, edited here: the page's content
│   ├── CHEATSHEET.md       # syntax and idioms, likewise
│   ├── README.md           # the page's Overview, likewise
│   ├── render.js           # the documents → HTML, run at build time by vite.config.js
│   ├── main.js             # section on screen, sheet, Cover, Copy
│   ├── search.js           # search over the page's own text
│   └── style.css
├── exercises/              # exercise videos, served at /exercises
│   ├── index.html
│   ├── main.js             # plays a video in place of its thumbnail
│   └── style.css
├── pomodoro/               # focus and break timers, served at /pomodoro
│   ├── index.html
│   ├── main.js             # timer, settings, localStorage
│   ├── sound.js            # every sound, made with Web Audio
│   ├── themes.js           # colour themes
│   └── style.css
├── public/                 # copied verbatim into the build
│   ├── CNAME               # custom domain
│   ├── 404.html            # static 404 served by GitHub Pages
│   ├── favicon.svg         # shared icon; favicon.ico and favicon-*.png are renders of it
│   ├── icon-maskable.svg   # full-bleed icon; apple-touch-icon.png is rendered from it
│   ├── icon-192x192.png, icon-512x512.png  # manifest icons
│   ├── manifest.webmanifest
│   ├── robots.txt
│   ├── cv.html, resume.html  # meta-refresh → /assets/resume.pdf
│   ├── start-sw.js         # /start service worker (offline, instant open)
│   ├── fonts/              # shared by v1, /start, /kannada, /code, /exercises, /pomodoro, and 404.html
│   └── assets/             # images, social card (og-cover), resume.pdf
├── vite.config.js          # multi-page build, default-page copies, CSS inlining,
│                           # CSP hashing, HTML minify, build-time values
│                           # (years, sitemap, security.txt), the Kannada
│                           # note, the code documents, dev routes
└── .github/
    ├── dependabot.yml      # weekly npm and Actions updates
    └── workflows/
        ├── deploy.yml      # build, and deploy on push to main
        └── rebuild.yml     # monthly redeploy for the build-time values
```

The icons are shared by every page and linked with a `?v=` query. When they change, bump it on every page, `404.html` included, or browsers keep showing the cached ones.

## Links

- Live site: <https://souravas.com>
- Repository: <https://github.com/souravas/souravas.github.io>
