import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const normalizeBase = (value: string | undefined) => {
  if (!value || value === '/') return '/'
  return `/${value.replace(/^\/+|\/+$/g, '')}/`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    base: normalizeBase(env.VITE_PUBLIC_BASE),
    plugins: [react()],
    build: {
      outDir: 'dist',
      target: 'es2019',
      cssTarget: 'chrome61',
      sourcemap: false,
      chunkSizeWarningLimit: 800,
    },
  }
})
