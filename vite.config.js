import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: true, // Use default minifier (esbuild)
    cssMinify: true,
    sourcemap: false,
    assetsInlineLimit: 4096
  },
  server: {
    open: true,
  },
  css: {
    devSourcemap: false
  }
})