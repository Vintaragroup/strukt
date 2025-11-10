import { defineConfig } from 'vite'
import path from 'path'
import { execSync } from 'node:child_process'

// Prefer environment-provided metadata first (e.g., Docker build args, CI vars), then fall back to git commands.
const envSha = process.env.GIT_SHA || process.env.COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || ''
const envBranch = process.env.GIT_BRANCH || process.env.VERCEL_GIT_BRANCH || process.env.BRANCH_NAME || ''

// Derive build metadata for in-app debugging & version display
function safeExec(cmd: string, fallback: string) {
  try {
    return execSync(cmd, { stdio: 'pipe' }).toString().trim() || fallback
  } catch {
    return fallback
  }
}
const gitSha = (envSha && envSha.trim()) || safeExec('git rev-parse --short HEAD', 'unknown')
const gitBranch = (envBranch && envBranch.trim()) || safeExec('git rev-parse --abbrev-ref HEAD', 'unknown')
const buildTime = new Date().toISOString()
const appVersion = process.env.npm_package_version || '0.0.0'

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
    // Align internal dev port with external mapped port to avoid confusion with other dev apps
    port: 5174,
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
  define: {
    'import.meta.env.VITE_GIT_SHA': JSON.stringify(gitSha),
    'import.meta.env.VITE_GIT_BRANCH': JSON.stringify(gitBranch),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
})
