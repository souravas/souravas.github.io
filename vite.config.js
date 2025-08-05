import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser', // Better minification than esbuild
    cssMinify: true,
    sourcemap: false,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks if needed in the future
        },
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
    // Enable tree shaking
    target: 'es2018',
    cssCodeSplit: false, // Inline CSS for better initial load
  },
  server: {
    open: true,
  },
  css: {
    devSourcemap: false
  },
  // Enable CSS purging for production
  esbuild: {
    drop: ['console', 'debugger'], // Remove console logs in production
  }
})