# Quick Start Guide

## 🚀 Running Locally

### Development Mode
```bash
# Run v1 (default)
npm run dev

# Run v1 specifically  
npm run dev:v1

# Run v2
npm run dev:v2

# Run integrated preview (after building)
npm run dev:integrated
```

### Building & Testing
```bash
# Build everything
npm run build

# Preview the integrated site
npm run preview
```

### URLs
- **Local v1**: http://localhost:3000
- **Local v2**: http://localhost:3001  
- **Local preview**: http://localhost:3002
  - Main site: http://localhost:3002/
  - v1 redirect: http://localhost:3002/v1 (redirects to /)
  - v2 site: http://localhost:3002/v2

## 🌐 Production URLs
- **Main site**: https://souravas.github.io
- **v1**: https://souravas.github.io/v1 (redirects to main)
- **v2**: https://souravas.github.io/v2

## 🔧 Development Workflow
1. Make changes in `v1/` or `v2/` directories
2. Test locally with `npm run dev:v1` or `npm run dev:v2`
3. Build and preview: `npm run build && npm run preview`
4. Deploy: `npm run deploy` or push to main branch (auto-deploy)

## 📦 Structure
```
/                  → v1 (main site)
/v1                → redirects to /
/v2                → v2 site
```
