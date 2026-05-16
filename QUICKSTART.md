# Quick Start

All commands run from `v3/`.

```bash
cd v3
npm install

npm run dev       # http://localhost:3003
npm run build     # → v3/dist
npm run preview   # serves v3/dist
```

## Deploy

Push to `main` — GitHub Actions builds and publishes to GitHub Pages (see [.github/workflows/deploy.yml](.github/workflows/deploy.yml)). PRs build only. Manual runs are available via the Actions tab.

## URLs

- Local dev: <http://localhost:3003>
- Production: <https://souravas.com>
- Resume redirects: `/cv`, `/resume` → `/assets/resume.pdf`
