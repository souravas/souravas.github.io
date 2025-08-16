import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    cssMinify: true,
    sourcemap: false,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `assets/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    target: 'es2018',
    cssCodeSplit: false,
  },
  server: {
    open: true,
    fs: {
      allow: ['..']
    }
  },
  plugins: [
    {
      name: 'html-routes',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/cv' || req.url === '/cv/') {
            req.url = '/cv.html';
          } else if (req.url === '/resume' || req.url === '/resume/') {
            req.url = '/resume.html';
          }
          next();
        });
      }
    }
  ],
  css: {
    devSourcemap: false
  },
  esbuild: {
    drop: ['console', 'debugger'],
  }
})
