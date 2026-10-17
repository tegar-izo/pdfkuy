import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// base './' — aset direferensikan relatif biar jalan di GitHub Pages project
// (username.github.io/pdfkuy) maupun di domain sendiri nanti.
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      // 'prompt': versi baru nunggu konfirmasi user (tombol di About / banner),
      // bukan reload paksa — dokumen yang lagi dikerjakan nggak kebuang.
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'pdfkuy — Urusan PDF? Gas.',
        short_name: 'pdfkuy',
        description:
          'Tools PDF serba bisa yang jalan 100% di browser. Gabung, split, kompres, watermark PDF. Tanpa upload, tanpa login.',
        lang: 'id',
        dir: 'ltr',
        id: './',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#faf7ff',
        theme_color: '#7c3aed',
        categories: ['productivity', 'utilities'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // semua hasil build (termasuk chunk pdf.js & worker-nya) masuk precache,
        // jadi tools tetap jalan walau sinyal hilang.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // pdf.worker.min.mjs + pdf-lib itu gede — dinaikin biar ke-cache semua
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // font Google (stylesheet + file fontnya) — biar offline pun tetap kebaca enak
            urlPattern: ({ url }) =>
              url.origin === 'https://fonts.googleapis.com' ||
              url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
