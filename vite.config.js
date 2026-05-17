import { defineConfig } from 'vite'
import { createHash } from 'node:crypto'

const SITE_ORIGIN = 'https://souravas.com'
// Redirect stubs (/cv, /resume) are intentionally excluded — they're
// meta-refresh pages to the PDF and would just be deindexed.
const SITEMAP_URLS = [
  { loc: '/', changefreq: 'monthly', priority: '1.0' },
]

// Compute SHA-256 hashes for inline <script> bodies and inject them
// into the CSP meta tag, replacing 'unsafe-inline'. Build-only — dev
// keeps 'unsafe-inline' so Vite's HMR client can run.
const cspInlineHashes = () => ({
  name: 'csp-inline-hashes',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      const re = /<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/gi
      const hashes = new Set()
      let m
      while ((m = re.exec(html)) !== null) {
        const digest = createHash('sha256').update(m[2], 'utf8').digest('base64')
        hashes.add(`'sha256-${digest}'`)
      }
      if (hashes.size === 0) return html
      const directive = `script-src 'self' ${[...hashes].join(' ')}`
      return html.replace(/script-src 'self' 'unsafe-inline'/, directive)
    },
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

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssMinify: true,
    sourcemap: false,
    target: 'es2020',
    cssCodeSplit: false,
    rolldownOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        minify: {
          compress: {
            dropConsole: true,
            dropDebugger: true,
          },
        },
      },
    },
  },
  server: {
    open: true,
  },
  plugins: [
    {
      name: 'html-routes',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/cv' || req.url === '/cv/') {
            req.url = '/cv.html'
          } else if (req.url === '/resume' || req.url === '/resume/') {
            req.url = '/resume.html'
          }
          next()
        })
      },
    },
    cspInlineHashes(),
    sitemap(),
  ],
})
