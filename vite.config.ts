import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // IMPORTANT: ajuste este base para o nome do repositório no GitHub Pages
  base: '/sistema-financeiro-central-truck-assistencia-3/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
