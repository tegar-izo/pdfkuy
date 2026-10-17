import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// base './' — aset direferensikan relatif biar jalan di GitHub Pages project
// (username.github.io/pdfkuy) maupun di domain sendiri nanti.
export default defineConfig({
  base: './',
  plugins: [vue(), tailwindcss()],
})
