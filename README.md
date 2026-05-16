# Sourav's Portfolio

Source for [souravas.com](https://souravas.com). All source lives in `v3/`; GitHub Actions builds and deploys to GitHub Pages on every push to `main`.

## Getting Started

```bash
cd v3
npm install
npm run dev       # dev server on http://localhost:3003
npm run build     # production build → v3/dist
npm run preview   # preview the production build
```

## Deployment

Pushes to `main` are built and deployed automatically via [.github/workflows/deploy.yml](.github/workflows/deploy.yml) using `actions/deploy-pages`. To trigger a deploy manually, use the *Run workflow* button on the Actions tab.

## Project Structure

```
souravas.github.io/
├── v3/                # Portfolio source (Vite)
│   ├── index.html
│   ├── public/        # static assets, CNAME, favicons, manifest
│   ├── src/
│   └── vite.config.js
└── .github/workflows/deploy.yml
```

## Links

- Live site: https://souravas.com
- Repository: https://github.com/souravas/souravas.github.io
