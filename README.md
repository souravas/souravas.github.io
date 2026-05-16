# Sourav's Portfolio

This repository contains the source for Sourav's portfolio website.

## 🚀 Getting Started

### Installation

```bash
# Install root dependencies
npm install

# Install v2 dependencies
cd v2 && npm install && cd ..
```

### Development

```bash
# Run the dev server
npm run dev
```

### Building

```bash
# Build the site
npm run build

# Clean build artifacts
npm run clean
```

### Deployment

```bash
# Deploy to GitHub Pages
npm run deploy

# Or use the shell script
./deploy.sh
```

## 📁 Project Structure

```
souravas.github.io/
├── v2/                 # Portfolio source
├── scripts/
│   ├── dev.js          # Dev server launcher
│   └── integrate.js    # Build copy + CNAME script
├── dist/               # Final build output
├── deploy.sh           # Deployment script
└── package.json        # Root package.json
```

## 🔧 How It Works

1. **Build**: `v2/` builds via Vite to `v2/dist/`
2. **Integrate**: `scripts/integrate.js` copies `v2/dist/` to `dist/` and adds the CNAME
3. **Deploy**: The `dist/` folder is published to GitHub Pages

## 🔗 Links

- **Live Site**: https://souravas.github.io
- **Repository**: https://github.com/souravas/souravas.github.io
