<script setup>
import { tools } from '../router'

const belum = tools.filter((t) => !t.ready)
</script>

<template>
  <section class="py-6">
    <h1 class="text-3xl font-extrabold tracking-tight">Tentang pdfkuy</h1>

    <div class="mt-6 space-y-6 text-[17px] leading-relaxed">
      <p>
        <strong>pdfkuy</strong> adalah tools PDF serba bisa yang jalan
        <strong>100% di browser kamu</strong>. Dibikin buat (terutama) mahasiswa teknik komputer
        yang urusannya PDF terus — kumpul laporan, gabungin scan, kompres biar muat limit upload,
        sampe cari nomor halaman sebelum dikumpul.
      </p>

      <div class="rounded-2xl border-2 border-ink bg-accent p-5 text-ink dark:border-paper">
        <h2 class="text-lg font-extrabold"><MIcon name="lock" /> Soal privasi — serius nih</h2>
        <p class="mt-2 text-sm">
          Nggak ada backend. Nggak ada file yang di-upload ke server mana pun. Semua proses —
          baca, gabung, potong, kompres — terjadi di RAM laptop/kamu sendiri. Tutup tab, semua
          jejak hilang. Nggak ada akun, nggak ada email, nggak ada analytics yang nyimpen
          dokumenmu. Buktiin gampang: buka DevTools → tab Network, upload file, lihat sendiri
          nggak ada request keluar.
        </p>
      </div>

      <div>
        <h2 class="text-xl font-extrabold">Dibikin pakai apa?</h2>
        <ul class="mt-2 list-inside list-disc space-y-1">
          <li><strong>Vue 3 + Vite + JavaScript</strong> — UI-nya</li>
          <li><strong>Tailwind CSS</strong> — tampilan playful + dark mode</li>
          <li><strong>pdf-lib</strong> — manipulasi PDF (merge, split, watermark...)</li>
          <li><strong>pdf.js</strong> — render thumbnail & kompres</li>
          <li><strong>Vue Router</strong> (hash mode) + <strong>GitHub Pages</strong> — hosting
            gratis, auto-deploy dari GitHub Actions</li>
        </ul>
      </div>

      <div>
        <h2 class="text-xl font-extrabold">Kenapa namanya "pdfkuy"?</h2>
        <p class="mt-2">
          Karena emang diniatnya gitu: <em>PDF-in, beresin tugas, gas.</em> Ringkas, nggak
          banyak basa-basi.
        </p>
      </div>

      <div v-if="belum.length">
        <h2 class="text-xl font-extrabold">Rencana berikutnya</h2>
        <p class="mt-2 opacity-80">
          Versi v1 udah lengkap (7 tools!). Ide v2 yang lagi dipertimbangkan: PDF → gambar,
          gabung banyak gambar sekaligus, dan lain-lain — santuy dulu. Mau usul fitur atau nemu
          bug? Tinggal buka
          <a
            href="https://github.com/tegar-izo/pdfkuy/issues"
            target="_blank"
            rel="noopener"
            class="font-bold underline hover:text-brand"
            >issue di GitHub</a
          >.
        </p>
      </div>

      <p class="text-sm opacity-70">
        Open source · gratis selamanya · nggak pernah ada file yang keluar dari perangkatmu.
      </p>
    </div>
  </section>
</template>
