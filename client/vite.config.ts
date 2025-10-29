import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  // @ts-expect-error Vitest-specific field is ignored by Vite during dev; present for test runs
  test: {
    environment: 'jsdom',
    include: ['src/tests/**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false,
    open: false,
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
    target: 'esnext',
    minify: 'esbuild',
  },
  esbuild: {
    loader: 'tsx',
    include: /src\/.*\.tsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@xyflow/react'],
  },
})
