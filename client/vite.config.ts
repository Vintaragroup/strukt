import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false,
    open: false,
    hmr: {
      host: 'localhost',
      port: 5174,
      protocol: 'ws',
    },
    proxy: {
      '/api': {
        target: 'http://server:5050',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
