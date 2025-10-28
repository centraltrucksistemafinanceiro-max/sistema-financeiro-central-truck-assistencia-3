import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/sistema-financeiro-central-truck-assistencia-3/',  // Base path for GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
