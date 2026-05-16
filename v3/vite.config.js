import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    cssMinify: true,
    sourcemap: false,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    target: 'es2020',
    cssCodeSplit: false,
  },
  server: {
    port: 3003,
    open: true,
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
      },
    },
  ],
  esbuild: {
    drop: ['console', 'debugger'],
  },
})
