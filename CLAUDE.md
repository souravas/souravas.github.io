# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Sourav's integrated portfolio website that manages two versions (v1 and v2) of his personal site. The project uses a unique dual-version architecture where:
- v2 serves as the main site at the root URL
- v1 is available at the `/v1` path  
- `/v2` redirects to the root (since v2 is now primary)

**IMPORTANT**: v2 is the active version - all changes should be made in the `v2/` directory unless specifically asked to modify v1. v1 is the legacy site that is preserved for reference but no longer actively maintained.

## Development Commands

### Prerequisites
```bash
# Install all dependencies (root, v1, and v2)
npm install
cd v1 && npm install && cd ..
cd v2 && npm install && cd ..
```

### Development Servers
```bash
# Run v1 development server (port 3000)
npm run dev:v1

# Run v2 development server (port 3001) 
npm run dev:v2

# Default to v1
npm run dev

# Run integrated preview after building (port 3002)
npm run dev:integrated
```

### Building
```bash
# Build both versions and integrate them
npm run build

# Build individual versions
npm run build:v1
npm run build:v2

# Integration step (combines both builds)
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

### Build Integration Process
1. **Independent Builds**: Each version (v1, v2) builds independently in its directory
2. **Integration Script** (`scripts/integrate.js`):
   - Copies v2 build to root of `dist/` (main site)
   - Copies v1 build to `dist/v1/` subdirectory
   - Creates redirect at `dist/v2/` that points to root
   - Handles CNAME file for custom domain

### Development Scripts
- **`scripts/dev.js`**: Vite development server launcher that handles v1/v2 selection
- **`scripts/integrate.js`**: Post-build integration that combines both versions

### Site Structure
```
Production URLs:
/          → v2 (main site)
/v1        → v1 site  
/v2        → redirects to / (since v2 is primary)

Local Development:
localhost:3000 → v1 dev server
localhost:3001 → v2 dev server
localhost:3002 → integrated preview
```

### Version Differences
- **v1**: Uses WindiCSS (`vite-plugin-windicss`)
- **v2**: Plain CSS, includes route handling middleware for `/cv` and `/resume` paths
- Both use Vite with Terser minification and production optimizations

### Key Files
- `scripts/dev.js`: Development server manager
- `scripts/integrate.js`: Build integration logic  
- `deploy.sh`: Production deployment script with dependency checks
- `QUICKSTART.md`: Quick reference for common tasks