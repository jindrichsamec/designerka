import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // relative asset paths: the same build works at the LAN root and under /designerka/ on GitHub Pages
  base: './',
})
