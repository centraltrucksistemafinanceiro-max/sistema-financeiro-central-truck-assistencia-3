import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',  // Mude para relativo
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
