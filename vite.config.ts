import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/sistema-financeiro-central-truck-assistencia-3/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
