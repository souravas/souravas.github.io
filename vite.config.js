import { defineConfig } from 'vite'
import { createHash } from 'node:crypto'
import { copyFileSync } from 'node:fs'
import { join } from 'node:path'

const SITE_ORIGIN = 'https://souravas.com'
// Redirect stubs (/cv, /resume) are intentionally excluded — they're
// meta-refresh pages to the PDF and would just be deindexed.
// /v1/ is excluded too: it's a duplicate of / (its canonical), and the
// /start/ pages are a personal start page (noindex).
const SITEMAP_URLS = [
  { loc: '/', changefreq: 'monthly', priority: '1.0' },
  { loc: '/v2/', changefreq: 'monthly', priority: '0.5' },
  { loc: '/v3/', changefreq: 'monthly', priority: '0.5' },
  { loc: '/v4/', changefreq: 'monthly', priority: '0.5' },
]

// Inline the built stylesheet into <head> in place of its <link>, removing
// the one render-blocking request. Must run before csp-inline-hashes so the
// resulting <style> body gets a style-src hash.
const inlineCss = () => ({
  name: 'inline-css',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(html, ctx) {
      const bundle = ctx.bundle
      if (!bundle) return html
      let out = html
      for (const [name, asset] of Object.entries(bundle)) {
        if (asset.type !== 'asset' || !name.endsWith('.css')) continue
        const href = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const link = new RegExp(`<link\\b[^>]*\\bhref="/${href}"[^>]*>`)
        if (!link.test(out)) continue
        const css = typeof asset.source === 'string' ? asset.source : Buffer.from(asset.source).toString()
        out = out.replace(link, `<style>${css.trim()}</style>`)
        delete bundle[name]
      }
      return out
    },
  },
})

// Tighten the CSP meta tag at build time:
//   - script-src: replace 'unsafe-inline' with SHA-256 hashes of each inline <script>
//   - style-src:  replace 'unsafe-inline' with SHA-256 hashes of each inline <style>
//                 (the stylesheet inlined by inline-css; CSSOM mutations via
//                 element.style.X aren't governed by style-src)
// Dev keeps 'unsafe-inline' on both so Vite's HMR client and injected
// style tags continue to work.
const cspInlineHashes = () => ({
  name: 'csp-inline-hashes',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      const hashAll = (re) => {
        const hashes = new Set()
        let m
        while ((m = re.exec(html)) !== null) {
          const digest = createHash('sha256').update(m[1], 'utf8').digest('base64')
          hashes.add(`'sha256-${digest}'`)
        }
        return [...hashes]
      }
      const scripts = hashAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)
      const styles = hashAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)
      let out = html
      if (scripts.length > 0) {
        out = out.replace(/script-src 'self' 'unsafe-inline'/, `script-src 'self' ${scripts.join(' ')}`)
      }
      out = out.replace(
        /style-src 'self' 'unsafe-inline'/,
        styles.length > 0 ? `style-src 'self' ${styles.join(' ')}` : "style-src 'self'",
      )
      return out
    },
  },
})

// Default designs: copy each built page to its section root so GitHub Pages
// serves it there — v1 at /, start v2 at /start/. All asset URLs in the
// built HTML are absolute (base '/'), so a copy renders identically from
// either path.
const DEFAULT_PAGES = [
  ['v1/index.html', 'index.html'],
  ['start/v2/index.html', 'start/index.html'],
]

const rootDefault = () => ({
  name: 'root-default',
  apply: 'build',
  writeBundle(options) {
    const outDir = options.dir ?? 'dist'
    for (const [from, to] of DEFAULT_PAGES) {
      copyFileSync(join(outDir, from), join(outDir, to))
    }
  },
})

const sitemap = () => ({
  name: 'sitemap',
  apply: 'build',
  generateBundle() {
    const today = new Date().toISOString().slice(0, 10)
    const body = SITEMAP_URLS.map(
      ({ loc, changefreq, priority }) =>
        `  <url>\n    <loc>${SITE_ORIGIN}${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
    ).join('\n')
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
    this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: xml })
  },
})

// Replace __BUILD_DATE__ / __BUILD_YEAR__ in index.html. article:modified_time
// uses the ISO timestamp; the footer fallback year uses the four-digit year so
// crawlers and JS-disabled visitors see a current copyright line.
const buildDate = () => ({
  name: 'build-date',
  apply: 'build',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      const now = new Date()
      return html
        .replaceAll('__BUILD_DATE__', now.toISOString())
        .replaceAll('__BUILD_YEAR__', String(now.getUTCFullYear()))
    },
  },
})

// Collapse whitespace inside JSON-LD blocks so they minify alongside the rest
// of the HTML. Runs before csp-inline-hashes so the SHA-256 matches the body
// the browser sees.
const jsonLdMinify = () => ({
  name: 'json-ld-minify',
  apply: 'build',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      return html.replace(
        /(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,
        (_, open, body, close) => {
          try {
            return open + JSON.stringify(JSON.parse(body)) + close
          } catch {
            return open + body.replace(/\s+/g, ' ').trim() + close
          }
        },
      )
    },
  },
})

// Lightweight HTML whitespace minifier. Skips <pre>, <textarea>, and
// inline <script>/<style> bodies (which already have their own minification
// or are CSP-hashed). Those are stashed behind NUL-delimited placeholders,
// which page text can't contain; the NULs are written as \x00 escapes so
// git keeps treating this file as text.
const htmlMinify = () => ({
  name: 'html-minify',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      const guards = []
      const stash = (s) => `\x00${guards.push(s) - 1}\x00`
      const out = html
        .replace(/<(pre|textarea|script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, (m) => stash(m))
        .replace(/<!--(?!\s*\[if)[\s\S]*?-->/g, '')
        .replace(/>\s+</g, '><')
        .replace(/\s{2,}/g, ' ')
        .replace(/\x00(\d+)\x00/g, (_, i) => guards[+i])
      return out.trim()
    },
  },
})

export default defineConfig({
  base: '/',
  // Six separate pages (v1–v4, start v1–v2), no SPA fallback.
  appType: 'mpa',
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2022',
    // Each page has its own stylesheet — keep them split so the pages' CSS
    // doesn't merge into one bundle.
    cssCodeSplit: true,
    // Single entry module per page, no dynamic imports — the modulepreload
    // polyfill would never fire, so don't ship it.
    modulePreload: { polyfill: false },
    rolldownOptions: {
      input: {
        v1: 'v1/index.html',
        v2: 'v2/index.html',
        v3: 'v3/index.html',
        v4: 'v4/index.html',
        'start-v1': 'start/v1/index.html',
        'start-v2': 'start/v2/index.html',
      },
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  server: {
    open: true,
  },
  plugins: [
    {
      // Mirror production routing locally. GitHub Pages serves /v2 → /v2/
      // (directory redirect) and / → index.html; dev and preview servers
      // need the same rewrites. Dev serves v1 at / and start v2 at /start
      // from source; preview already has the DEFAULT_PAGES copies, so only
      // the slashless paths need help.
      name: 'html-routes',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const path = req.url.split('?')[0]
          if (path === '/' || path === '/v1' || path === '/v1/') {
            req.url = '/v1/index.html'
          } else if (path === '/v2' || path === '/v2/') {
            req.url = '/v2/index.html'
          } else if (path === '/v3' || path === '/v3/') {
            req.url = '/v3/index.html'
          } else if (path === '/v4' || path === '/v4/') {
            req.url = '/v4/index.html'
          } else if (path === '/start/v1' || path === '/start/v1/') {
            req.url = '/start/v1/index.html'
          } else if (path === '/start' || path === '/start/' || path === '/start/v2' || path === '/start/v2/') {
            req.url = '/start/v2/index.html'
          } else if (path === '/cv' || path === '/cv/') {
            req.url = '/cv.html'
          } else if (path === '/resume' || path === '/resume/') {
            req.url = '/resume.html'
          }
          next()
        })
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, _res, next) => {
          const path = req.url.split('?')[0]
          if (['/v1', '/v2', '/v3', '/v4', '/start', '/start/v1', '/start/v2'].includes(path)) {
            req.url = `${path}/index.html`
          } else if (path === '/cv' || path === '/cv/') {
            req.url = '/cv.html'
          } else if (path === '/resume' || path === '/resume/') {
            req.url = '/resume.html'
          }
          next()
        })
      },
    },
    buildDate(),
    jsonLdMinify(),
    inlineCss(),
    cspInlineHashes(),
    htmlMinify(),
    sitemap(),
    rootDefault(),
  ],
})
