# Sourav's Portfolio Site

This repository houses the source code for [souravas.com](https://souravas.com) — a personal portfolio website showcasing my profile, skills, experience, and contact information. The site is built with Vite and implements SEO best practices including `robots.txt` and `sitemap.xml`.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Build & Deployment](#build--deployment)
- [File Structure](#file-structure)
- [License](#license)

---

## Overview

- **Live Site:** [souravas.com](https://souravas.com)
- **Description:**
  - Single-page portfolio: includes About, Skills, Experience, Certifications, Education, Projects, and Contact sections.
  - Uses [Vite](https://vitejs.dev/) for fast development and optimized builds.
  - Provides `robots.txt` and `sitemap.xml` for search engine crawling and indexing.
  - JSON-LD structured data for improved SEO (`<script type="application/ld+json">...`).

---

## Features

- **Responsive Layout**: Adapts to various screen sizes (mobile, tablet, desktop).
- **Dark/Light Theme Toggle**: Allows users to switch between color modes with preference storage.
- **Accessible Navigation**: "Skip to content" link, semantic HTML, and keyboard-friendly interface.
- **Progressive Web App (PWA)**: Service worker for offline functionality and app-like experience.
- **Performance Optimized**:
  - Terser minification for JavaScript
  - CSS optimization with cssnano and PostCSS
  - Resource hints and DNS prefetching for external domains
  - Aggressive caching strategies with service worker
  - Optimized font loading
- **Optimized SEO**:
  - `robots.txt` to allow all crawlers and link to sitemap.
  - `sitemap.xml` for better URL discovery.
  - JSON-LD structured data for rich search results.
  - Content Security Policy headers for security.

---

## Technologies Used

- **HTML5** & **CSS3** (Poppins font & responsive design)
- **JavaScript (ES6+)** with modern optimization
- **Vite** for front-end tooling and build optimization
- **PostCSS** with autoprefixer and cssnano for CSS optimization
- **Terser** for advanced JavaScript minification
- **Service Worker** for PWA functionality and caching
- **GitHub Pages** for deployment
- **Namecheap** for custom domain

---

## Installation

1. **Clone** the repository:
    ```bash
    git clone https://github.com/souravas/souravas.github.io.git
    cd souravas.github.io
    ```

2. **Install** dependencies:
   ```bash
   npm install
   ```

3. **Start** the development server:
   ```bash
   npm run dev
   ```

---

## Build & Deployment

- **Development**:
  ```bash
  npm run dev
  ```
  This starts Vite's development server with hot module replacement.

- **Production Build**:
  ```bash
  npm run build
  ```
  This generates optimized assets in the `dist` directory with:
  - Terser minification for JavaScript
  - CSS optimization with cssnano
  - Resource bundling and tree shaking
  - Service worker generation for PWA functionality

- **Optimization Analysis**:
  ```bash
  npm run optimize
  ```
  This builds the site and runs bundle analysis to check optimization effectiveness.

- **Preview Production Build**:
  ```bash
  npm run preview
  ```
  This serves the production build locally for testing.

- **Deploy**:
  ```bash
  npm run deploy
  ```
  This builds the site and deploys it to GitHub Pages using the gh-pages package.

- **Quick Optimization** (optional):
  ```bash
  ./optimize.sh
  ```
  This runs a comprehensive optimization script that cleans, builds, and analyzes the site.

---

## File Structure

```
souravas.github.io/
├─ src/
│  ├─ style.css       # Main stylesheet
│  └─ main.js         # JavaScript functionality (includes service worker registration)
├─ public/
│  ├─ assets/         # Images, resume PDF, etc.
│  ├─ favicon.ico     # Site favicon
│  ├─ robots.txt      # Instructions for web crawlers
│  ├─ sitemap.xml     # Site structure for search engines
│  ├─ resume.html     # Resume redirect page
│  ├─ cv.html         # CV redirect page
│  ├─ sw.js           # Service worker for PWA functionality
│  ├─ _headers        # HTTP headers for security and caching
│  └─ site.webmanifest # Progressive Web App manifest
├─ index.html         # Main HTML entry point
├─ vite.config.js     # Vite configuration with optimization settings
├─ postcss.config.js  # PostCSS configuration for CSS optimization
├─ package.json       # Project dependencies and scripts
├─ optimize.sh        # Optional optimization script
├─ CNAME              # Custom domain configuration
└─ README.md          # Project documentation
```

- **`src/`**: Contains JavaScript and CSS source files.
- **`public/`**: Static files served at the root path.
- **`index.html`**: Main HTML document with structured data.
- **`vite.config.js`**: Configuration for the Vite build tool.

---

## Performance Optimization

The site implements several performance optimizations:

### **Build Optimizations**
- **JavaScript**: Minified with Terser (~2.78kB gzipped)
- **CSS**: Optimized with cssnano and PostCSS (~2.15kB gzipped)
- **HTML**: Compressed and optimized (~8.34kB gzipped)
- **Total bundle size**: ~12.5kB gzipped

### **Caching Strategy**
- **Service Worker**: Aggressive caching for repeat visits
- **HTTP Headers**: Long-term caching for static assets
- **Progressive Web App**: Offline functionality and fast loading

### **Loading Performance**
- **Resource Hints**: DNS prefetching for external domains
- **Font Optimization**: Async loading with fallbacks
- **Critical CSS**: Inlined for faster initial render
- **Tree Shaking**: Dead code elimination

### **Monitoring**
Use `npm run optimize` to analyze bundle sizes and performance metrics.

---

## License

This project is open source and available under the Apache License.