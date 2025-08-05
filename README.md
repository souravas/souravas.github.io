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
- **Optimized SEO**:
  - `robots.txt` to allow all crawlers and link to sitemap.
  - `sitemap.xml` for better URL discovery.
  - JSON-LD structured data for rich search results.

---

## Technologies Used

- **HTML5** & **CSS3** (Poppins font & responsive design)
- **JavaScript (ES6+)**
- **Vite** for front-end tooling and build optimization
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
  This generates optimized assets in the `dist` directory.

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

---

## File Structure

```
souravas.github.io/
├─ src/
│  ├─ style.css       # Main stylesheet
│  └─ main.js         # JavaScript functionality
├─ public/
│  ├─ assets/         # Images, resume PDF, etc.
│  ├─ favicon.ico     # Site favicon
│  ├─ robots.txt      # Instructions for web crawlers
│  ├─ sitemap.xml     # Site structure for search engines
│  ├─ resume.html     # Resume redirect page
│  ├─ cv.html         # CV redirect page
│  └─ site.webmanifest # Progressive Web App manifest
├─ index.html         # Main HTML entry point
├─ vite.config.js     # Vite configuration
├─ package.json       # Project dependencies and scripts
├─ CNAME              # Custom domain configuration
└─ README.md          # Project documentation
```

- **`src/`**: Contains JavaScript and CSS source files.
- **`public/`**: Static files served at the root path.
- **`index.html`**: Main HTML document with structured data.
- **`vite.config.js`**: Configuration for the Vite build tool.

---

## License

This project is open source and available under the Apache License.