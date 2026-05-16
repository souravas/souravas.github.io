# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Sourav's portfolio website. All source lives under `v2/`; the root is a thin build wrapper that copies the v2 build into `dist/` for GitHub Pages.

**IMPORTANT**: All changes should be made in the `v2/` directory.

## Development Commands

### Prerequisites
```bash
# Install dependencies (root + v2)
npm install
cd v2 && npm install && cd ..
```

### Development Server
```bash
# Run the dev server (port 3001)
npm run dev

# Run integrated preview after building (port 3002)
npm run dev:integrated
```

### Building
```bash
# Build v2 and copy to dist/
npm run build

# Build v2 only
npm run build:v2

# Run the copy/CNAME step
npm run integrate

# Preview integrated build
npm run preview

# Clean all build artifacts
npm run clean
```

### Deployment
```bash
# Deploy to GitHub Pages
npm run deploy

# Alternative deployment script
./deploy.sh
```

## Architecture

### Build Process
1. **v2 Build**: Vite builds `v2/` to `v2/dist/`
2. **Integration Script** (`scripts/integrate.js`):
   - Copies `v2/dist/` to `dist/`
   - Copies the v2 CNAME file for the custom domain

### Development Scripts
- **`scripts/dev.js`**: Vite dev server launcher for v2
- **`scripts/integrate.js`**: Copies v2 build output and CNAME into `dist/`

### Site Structure
```
Production URL:
/          → portfolio (served from v2 build)

Local Development:
localhost:3001 → v2 dev server
localhost:3002 → integrated preview
```

### Key Files
- `scripts/dev.js`: Development server manager
- `scripts/integrate.js`: Build copy + CNAME logic
- `deploy.sh`: Production deployment script with dependency checks
- `QUICKSTART.md`: Quick reference for common tasks
