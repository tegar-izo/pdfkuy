<script setup>
import { computed } from 'vue'
import { tools } from '../router'
import { usePwaUpdate } from '../composables/usePwaUpdate'

const belum = tools.filter((t) => !t.ready)

const { needRefresh, checking, checkResult, lastChecked, checkForUpdate, applyUpdate } =
  usePwaUpdate()

const jam = (d) =>
  d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'

const hasilCek = computed(() => {
  switch (checkResult.value) {
    case 'uptodate':
      return { teks: 'Udah paling baru. Nggak ada yang perlu di-update.', kelas: 'text-brand dark:text-brand-light' }
    case 'new-version':
      return { teks: 'Ketemu versi baru! Klik tombol di bawah biar kepasang.', kelas: '' }
    case 'error':
      return { teks: 'Gagal cek update. Coba lagi nanti ya.', kelas: 'opacity-70' }
    case 'unsupported':
      return { teks: 'Browser kamu belum dukung mode aplikasi (service worker).', kelas: 'opacity-70' }
    default:
      return null
  }
})
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
          <li><strong>PWA + Workbox</strong> — biar bisa dibuka offline & gampang update</li>
        </ul>
      </div>

      <div class="rounded-2xl border-2 border-ink bg-white p-5 dark:border-paper dark:bg-ink">
        <h2 class="text-lg font-extrabold"><MIcon name="download_for_offline" /> Update & mode offline</h2>
        <p class="mt-2 text-sm opacity-80">
          pdfkuy itu aplikasi web (PWA). Begitu pernah dibuka sekali, semua tools-nya udah
          tersimpan di perangkatmu — jadi tetap jalan walau sinyal hilang atau lagi di lantai
          basement. Update otomatis ke-detek tiap kali kamu buka atau balik ke tab ini, tapi
          bisa juga dicek manual lewat tombol di bawah.
        </p>

        <div class="mt-4 flex flex-wrap items-center gap-3">
          <button
            class="rounded-xl border-2 border-ink bg-accent px-4 py-2 text-sm font-extrabold text-ink shadow-chunky-sm transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 dark:border-ink"
            :disabled="checking"
            @click="checkForUpdate()"
          >
            <MIcon name="sync" :class="{ 'animate-spin': checking }" />
            {{ checking ? 'Lagi cek...' : 'Cek update sekarang' }}
          </button>

          <button
            v-if="needRefresh"
            class="rounded-xl border-2 border-ink bg-ink px-4 py-2 text-sm font-extrabold text-paper shadow-chunky-sm transition-transform hover:-translate-y-0.5 dark:border-paper"
            @click="applyUpdate"
          >
            <MIcon name="system_update_alt" /> Muat versi baru
          </button>

          <p v-if="hasilCek" class="text-sm font-bold" :class="hasilCek.kelas">
            <MIcon :name="checkResult === 'uptodate' ? 'check_circle' : 'info'" />
            {{ hasilCek.teks }}
          </p>
        </div>

        <p v-if="lastChecked" class="mt-2 text-xs opacity-60">
          Terakhir dicek: {{ jam(lastChecked) }}
        </p>
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
