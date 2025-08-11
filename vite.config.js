import { defineConfig } from 'vite'

export default defineConfig({
  root: 'dist',
  server: {
    port: 3000,
    open: true,
    host: true
  }
})
