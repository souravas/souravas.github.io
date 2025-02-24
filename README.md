# Sourav’s Portfolio Site

This repository houses the source code for [souravas.com](https://souravas.com) — a personal portfolio website showcasing my profile, skills, experience, and contact information. The site is built with Parcel and includes best practices for SEO like `robots.txt` and `sitemap.xml`.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Build & Deployment](#build--deployment)
- [File Structure](#file-structure)
- [Credits](#credits)
- [License](#license)

---

## Overview

- **Live Site:** [souravas.com](https://souravas.com)
- **Description:**
  - Single-page portfolio: includes About, Skills, Experience, Certifications, Education, and Contact sections.
  - Uses [Parcel](https://parceljs.org/) for bundling and asset optimization.
  - Provides `robots.txt` and `sitemap.xml` for search engine crawling and indexing.
  - JSON-LD structured data for improved SEO (`<script type="application/ld+json">...`).

---

## Features

- **Responsive Layout**: Adapts to various screen sizes (mobile, tablet, desktop).
- **Dark/Light Theme Toggle**: Allows users to switch between color modes.
- **Accessible Navigation**: “Skip to content” link, accessible labels, and keyboard-friendly menu.
- **Optimized SEO**:
  - `robots.txt` to allow all crawlers and link to sitemap.
  - `sitemap.xml` for better URL discovery.
  - `application/ld+json` structured data for person/organization details.
- **Form Handling**: Simple contact form (can be integrated with an external service or email endpoint).

---

## Technologies Used

- **HTML5** & **CSS3** (Poppins font & responsive design)
- **JavaScript (ES6+)**
- **Parcel** (v2) for bundling
  - [`@parcel/transformer-jsonld`](https://parceljs.org/languages/jsonld/) (handles JSON-LD files)
  - [`@parcel/packager-raw-url`](https://parceljs.org/recipes/raw/) (raw-file packing if needed)
- **copyfiles** for post-build file copying
- **GitHub Pages** for deployment

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

---

## Build & Deployment

- **Production Build**:
  ```bash
  npm run build
  ```
  This will:
  1. Clean previous build artifacts (`.parcel-cache`, `dist`).
  2. Run Parcel build on your entry files (e.g., `index.html`).
  3. Copy the output files from `dist` back into the root for GitHub Pages.

- **Deploy**:
  - If you are hosting directly from the `main` branch on GitHub Pages, the updated site goes live automatically once the final files are pushed.
  - Otherwise, if you use a separate `gh-pages` branch, push the `dist` contents there (the current configuration copies them to root, so your final approach may vary).

---

## File Structure

Below is a simplified look at the repo’s file layout:

```
souravas.github.io/
├─ src/
│  ├─ assets/           # images, icons, etc.
│  ├─ index.html        # main HTML entry
│  ├─ style.css         # main CSS
│  └─ script.js         # main JS
├─ robots.txt           # Basic robots instructions & sitemap link
├─ sitemap.xml          # Sitemap for improved SEO
├─ package.json
├─ .parcel-cache/       # (created on build)
├─ dist/                # (created on build)
└─ README.md
```

- **`src/`**: Contains the actual web app source files (HTML, CSS, JS).
- **`robots.txt`** and **`sitemap.xml`**: Placed in root to be served at `https://souravas.com/robots.txt` and `https://souravas.com/sitemap.xml`.
- **`package.json`**: Scripts, dependencies, and configurations for Parcel.
- **`dist/`**: Generated build folder (copied into root via `postbuild`).

---

## Credits

- **Icons**: Potentially from [Font Awesome](https://fontawesome.com/) SVG icons.
- **Fonts**: [Google Fonts](https://fonts.google.com/) (Poppins).
- **Frameworks/Tools**: [Parcel](https://parceljs.org/), [copyfiles](https://www.npmjs.com/package/copyfiles).

---

## License

Distributed under the MIT License. See `LICENSE` for details (if added).