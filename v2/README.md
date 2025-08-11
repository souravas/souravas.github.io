# Sourav — Personal Site

A fast, accessible, and clean personal site built with semantic HTML, modern CSS, and a pinch of vanilla JS.

## Quick start

1. **Local preview**: just open `index.html` in a browser.
2. **GitHub Pages**:
   - Create a repo named `# Sourav's Portfolio Website v2

A modern, responsive portfolio website built with clean HTML, CSS, and JavaScript, optimized with Vite build tools.

## ✨ Features

- **Modern Design**: Clean, professional layout with dark/light theme support
- **Responsive**: Mobile-first approach with responsive design
- **Performance Optimized**: Built with Vite for optimal bundle size and loading speed
- **SEO Ready**: Proper meta tags, structured data, and semantic HTML
- **GitHub Integration**: Automatically loads and displays latest projects from GitHub API
- **Contact Form**: Functional contact form with mailto fallback

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Build and analyze bundle size
npm run optimize
```

### Deployment

```bash
# Deploy to GitHub Pages
npm run deploy
```

## 🛠 Tech Stack

- **Build Tool**: Vite 6.x
- **Styling**: Vanilla CSS with CSS Custom Properties
- **JavaScript**: ES6+ modules
- **Optimization**: PostCSS with Autoprefixer and CSSnano
- **Bundle Analysis**: Built-in bundle analyzer
- **Deployment**: GitHub Pages

## 📁 Project Structure

```
├── src/
│   ├── main.js          # Main JavaScript entry point
│   └── style.css        # Main stylesheet
├── public/
│   ├── assets/          # Static assets (images, icons)
│   ├── favicon.svg      # Site favicon
│   ├── manifest.webmanifest  # PWA manifest
│   ├── robots.txt       # Search engine robots file
│   └── sitemap.xml      # Site sitemap
├── dist/                # Built files (generated)
├── index.html           # Main HTML file
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
├── postcss.config.js    # PostCSS configuration
└── optimize.sh          # Build optimization script
```

## 🎨 Customization

### Theme Colors

Edit the CSS custom properties in `src/style.css`:

```css
:root {
  --bg: #0b1220;        /* Background */
  --text: #e2e8f0;      /* Text color */
  --brand: #0ea5e9;     /* Primary brand color */
  --brand-2: #22d3ee;   /* Secondary brand color */
}
```

### Content

- Update personal information in `index.html`
- Modify the GitHub username in `src/main.js` for project loading
- Replace profile images in `public/assets/`

## 📈 Performance Features

- **Minification**: CSS and JS are minified for production
- **Tree Shaking**: Unused code is automatically removed
- **Asset Optimization**: Images and assets are optimized
- **Code Splitting**: Automatic code splitting for better caching
- **Bundle Analysis**: Built-in bundle size analysis

## 🔧 Build Configuration

The build is configured for optimal performance:

- **Target**: ES2018+ for modern browsers
- **Minifier**: Terser for better compression
- **CSS**: Inline CSS for reduced requests
- **Assets**: Optimized asset handling with versioning

## 📱 Browser Support

- Chrome/Edge 79+
- Firefox 72+
- Safari 13+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🚀 Performance Metrics

After optimization:
- **CSS**: ~5KB (gzipped: ~1.7KB)
- **JavaScript**: ~2.6KB (gzipped: ~1.3KB)
- **HTML**: ~11KB (gzipped: ~3.4KB)
- **Total Bundle**: <10KB gzipped

## 📝 License

MIT License - feel free to use this as a template for your own portfolio!` (or use your existing site repo).
   - Push these files to the repository root.
   - (Optional) Put your custom domain in a file named `CNAME` at the repo root (already included as `CNAME` here).

## Custom domain (souravas.com)

- Keep the `CNAME` file containing `souravas.com` in the repository root.
- In your domain provider’s DNS (Namecheap), set the relevant records per GitHub Pages docs (CNAME to the pages hostname; A/ALIAS if needed for apex).

## Customize

- Replace `assets/profile-placeholder.svg` with your photo or illustration.
- Edit content directly in `index.html` (About, Skills, Experience, etc.).
- Colors and spacing live in `css/main.css` (CSS variables at the top).
- Project cards auto-pull from GitHub via client-side fetch. Adjust logic in `js/main.js`.

## Contact form

The demo form opens a mail draft via `mailto:`. Swap it with Formspree/Netlify or your own backend if you want submissions.

## Performance & SEO

- Minimal assets, preloaded CSS, semantic structure, JSON‑LD, OpenGraph, web manifest, sitemap, and robots.txt.
- Accessible contrasts and keyboard-friendly controls.
