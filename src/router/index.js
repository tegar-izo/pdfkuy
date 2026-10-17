import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import ToolPage from '../pages/ToolPage.vue'

// Daftar tool v1 — dipakai router sekaligus kartu di landing page.
// `component` berupa lazy loader supaya tiap tool jadi chunk terpisah:
// bundle awal tetap ringan, pdf-lib/pdfjs-dist cuma dimuat saat tool-nya dibuka.
export const tools = [
  {
    path: '/merge',
    name: 'merge',
    title: 'Gabung PDF',
    tagline: 'Gabung banyak PDF jadi satu file. Beres.',
    emoji: '🧩',
    milestone: 2,
    ready: true,
    component: () => import('../pages/MergePage.vue'),
  },
  {
    path: '/split',
    name: 'split',
    title: 'Split PDF',
    tagline: 'Ambil atau buang halaman tertentu sesuka hati.',
    emoji: '✂️',
    milestone: 3,
    ready: true,
    component: () => import('../pages/SplitPage.vue'),
  },
  {
    path: '/susun',
    name: 'susun',
    title: 'Susun Halaman',
    tagline: 'Puter, geser, urutin ulang halaman pakai drag atau tombol panah.',
    emoji: '🔄',
    milestone: 4,
    ready: true,
    component: () => import('../pages/ArrangePage.vue'),
  },
  {
    path: '/gambar-ke-pdf',
    name: 'gambar-ke-pdf',
    title: 'Gambar ke PDF',
    tagline: 'Tumpukan foto atau scan tugas jadi PDF rapi.',
    emoji: '🖼️',
    milestone: 5,
    ready: true,
    component: () => import('../pages/ImageToPdfPage.vue'),
  },
  {
    path: '/nomor-halaman',
    name: 'nomor-halaman',
    title: 'Nomor Halaman',
    tagline: 'Kasih nomor halaman otomatis, biar nggak dimarahin dosen.',
    emoji: '🔢',
    milestone: 6,
    ready: true,
    component: () => import('../pages/PageNumberPage.vue'),
  },
  {
    path: '/watermark',
    name: 'watermark',
    title: 'Watermark',
    tagline: 'Cas nama/NIM di tiap halaman, tugas jadi lebih aman.',
    emoji: '💧',
    milestone: 7,
    ready: true,
    component: () => import('../pages/WatermarkPage.vue'),
  },
  {
    path: '/kompres',
    name: 'kompres',
    title: 'Kompres PDF',
    tagline: 'Kecilin ukuran file biar muat limit upload kampus.',
    emoji: '🗜️',
    milestone: 8,
    ready: true,
    component: () => import('../pages/CompressPage.vue'),
  },
]

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/about', name: 'about', component: () => import('../pages/AboutPage.vue') },
  ...tools.map((tool) => ({
    path: tool.path,
    name: tool.name,
    component: tool.component ?? ToolPage,
    meta: tool,
  })),
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

export default router
