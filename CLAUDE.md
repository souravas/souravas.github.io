# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Sourav's portfolio website. All source lives under `v3/`; the root is a thin build wrapper that copies the v3 build into `dist/` for GitHub Pages.

**IMPORTANT**: All changes should be made in the `v3/` directory.

## Development Commands

### Prerequisites
```bash
# Install dependencies (root + v3)
npm install
cd v3 && npm install && cd ..
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
# Build v3 and copy to dist/
npm run build

# Build v3 only
npm run build:v3

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
1. **v3 Build**: Vite builds `v3/` to `v3/dist/`
2. **Integration Script** (`scripts/integrate.js`):
   - Copies `v3/dist/` to `dist/`
   - Copies the v3 CNAME file for the custom domain

### Development Scripts
- **`scripts/integrate.js`**: Copies v3 build output and CNAME into `dist/`

### Site Structure
```
Production URL:
/          → portfolio (served from v3 build)

Local Development:
localhost:3001 → v3 dev server
localhost:3002 → integrated preview
```

### Key Files
- `scripts/integrate.js`: Build copy + CNAME logic
- `deploy.sh`: Production deployment script with dependency checks
- `QUICKSTART.md`: Quick reference for common tasks
