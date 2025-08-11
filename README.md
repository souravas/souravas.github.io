# Sourav's Portfolio - Integrated Site

This repository contains an integrated version of Sourav's portfolio website that serves both v1 and v2 versions.

## 🌐 Site Structure

- **Main site (/)**: Serves the original v1 design
- **v1 (/v1)**: Redirects to the main site
- **v2 (/v2)**: Serves the new v2 design

## 🚀 Getting Started

### Installation

```bash
# Install dependencies for the root project
npm install

# Install dependencies for v1
cd v1 && npm install && cd ..

# Install dependencies for v2
cd v2 && npm install && cd ..
```

### Development

```bash
# Run v1 in development mode
npm run dev:v1

# Run v2 in development mode  
npm run dev:v2

# Run v1 by default
npm run dev
```

### Building

```bash
# Build both versions and integrate them
npm run build

# Build only v1
npm run build:v1

# Build only v2
npm run build:v2

# Clean all build artifacts
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
souravas.github.io_integrated/
├── v1/                 # Original portfolio (v1)
├── v2/                 # New portfolio design (v2)
├── scripts/
│   └── integrate.js    # Integration script
├── dist/               # Final integrated build
├── deploy.sh           # Deployment script
└── package.json        # Root package.json
```

## 🔧 How It Works

1. **Build Process**: Each version is built independently in its respective directory
2. **Integration**: The `integrate.js` script combines both builds:
   - v1 files are copied to the root of `dist/`
   - v2 files are copied to `dist/v2/`
   - A redirect is created at `dist/v1/` that points to the root
3. **Deployment**: The integrated `dist/` folder is deployed to GitHub Pages

## 🛠 Maintenance

### Adding New Features

- **For v1**: Work in the `v1/` directory
- **For v2**: Work in the `v2/` directory  
- **For shared functionality**: Consider updating the integration script

### Updating Dependencies

```bash
# Update root dependencies
npm update

# Update v1 dependencies
cd v1 && npm update && cd ..

# Update v2 dependencies
cd v2 && npm update && cd ..
```

## 📊 Performance

Both versions are optimized for production with:
- Minified assets
- Tree shaking
- CSS optimization  
- Image optimization
- Service worker caching (where applicable)

## 🔗 Links

- **Live Site**: https://souravas.github.io
- **V2 Version**: https://souravas.github.io/v2
- **Repository**: https://github.com/souravas/souravas.github.io
