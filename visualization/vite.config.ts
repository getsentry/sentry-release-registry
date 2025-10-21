import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/sentry-release-registry/',
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
})

