# Sourav's Portfolio

Source for [souravas.com](https://souravas.com). Vanilla HTML / CSS / JS built with Vite — no framework. All source lives in `v3/`; GitHub Actions builds and deploys to GitHub Pages on every push to `main`.

## Getting Started

```bash
cd v3
npm install
npm run dev       # dev server on http://localhost:3003
npm run build     # production build → v3/dist
npm run preview   # preview the production build
```

## Deployment

Pushes to `main` are built and deployed automatically via [.github/workflows/deploy.yml](.github/workflows/deploy.yml) using `actions/deploy-pages`. Pull requests run the build only. To trigger a deploy manually, use *Run workflow* on the Actions tab.

## Project Structure

```
souravas.github.io/
├── v3/
│   ├── index.html              # single-page entry
│   ├── 404.html                # static 404 served by GitHub Pages
│   ├── src/
│   │   ├── main.js             # entry script
│   │   └── style.css
│   ├── public/                 # copied verbatim into the build
│   │   ├── CNAME               # custom domain
│   │   ├── manifest.webmanifest
│   │   ├── robots.txt
│   │   ├── cv.html, resume.html  # meta-refresh → /assets/resume.pdf
│   │   └── assets/             # images + resume.pdf
│   └── vite.config.js          # build, CSP hashing, sitemap, dev /cv & /resume routes
└── .github/workflows/deploy.yml
```

## Links

- Live site: <https://souravas.com>
- Repository: <https://github.com/souravas/souravas.github.io>
