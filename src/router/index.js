import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import ToolPage from '../pages/ToolPage.vue'
import MergePage from '../pages/MergePage.vue'

// Daftar tool v1 — dipakai router sekaligus kartu di landing page.
// tiap entry: path, nama unik, judul, tagline, emoji, milestone.
export const tools = [
  {
    path: '/merge',
    name: 'merge',
    title: 'Gabung PDF',
    tagline: 'Gabung banyak PDF jadi satu file. Beres.',
    emoji: '🧩',
    milestone: 2,
    ready: true,
    component: MergePage,
  },
  {
    path: '/split',
    name: 'split',
    title: 'Split PDF',
    tagline: 'Ambil atau buang halaman tertentu sesuka hati.',
    emoji: '✂️',
    milestone: 3,
  },
  {
    path: '/susun',
    name: 'susun',
    title: 'Susun Halaman',
    tagline: 'Puter, geser, urutin ulang halaman pakai drag atau tombol panah.',
    emoji: '🔄',
    milestone: 4,
  },
  {
    path: '/gambar-ke-pdf',
    name: 'gambar-ke-pdf',
    title: 'Gambar ke PDF',
    tagline: 'Tumpukan foto atau scan tugas jadi PDF rapi.',
    emoji: '🖼️',
    milestone: 5,
  },
  {
    path: '/nomor-halaman',
    name: 'nomor-halaman',
    title: 'Nomor Halaman',
    tagline: 'Kasih nomor halaman otomatis, biar nggak dimarahin dosen.',
    emoji: '🔢',
    milestone: 6,
  },
  {
    path: '/watermark',
    name: 'watermark',
    title: 'Watermark',
    tagline: 'Cas nama/NIM di tiap halaman, tugas jadi lebih aman.',
    emoji: '💧',
    milestone: 7,
  },
  {
    path: '/kompres',
    name: 'kompres',
    title: 'Kompres PDF',
    tagline: 'Kecilin ukuran file biar muat limit upload kampus.',
    emoji: '🗜️',
    milestone: 8,
  },
]

const routes = [
  { path: '/', name: 'home', component: HomePage },
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
