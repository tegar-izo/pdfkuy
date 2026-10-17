<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import UploadZone from '../components/UploadZone.vue'
import { formatBytes, loadPdfMeta, downloadBlob } from '../lib/pdf'
import { compressPdf } from '../lib/compress'

const doc = ref(null) // { buffer, pageCount, name, size }
const level = ref('sedang')
const busy = ref(false)
const progress = ref({ done: 0, total: 0 })
const error = ref('')
const result = ref(null) // { blob, name, size, before }

const LEVELS = [
  {
    value: 'kecil',
    icon: '🐭',
    label: 'Kecil banget',
    detail: '72 DPI · kualitas 50%',
    hint: 'Paling ramping. Tampilan pas-pasan.',
    dpi: 72,
    quality: 0.5,
  },
  {
    value: 'sedang',
    icon: '🐞',
    label: 'Sedang',
    detail: '110 DPI · kualitas 70%',
    hint: 'Ukuran jauh turun, tampilan masih enak. Rekomendasi.',
    dpi: 110,
    quality: 0.7,
  },
  {
    value: 'tinggi',
    icon: '🦅',
    label: 'Tinggi',
    detail: '150 DPI · kualitas 85%',
    hint: 'Detail lebih terjaga, ukuran tetep lebih kecil.',
    dpi: 150,
    quality: 0.85,
  },
]

let token = 0

onBeforeUnmount(() => {
  token++ // hentikan kompresi yang masih jalan
})

const chosen = computed(() => LEVELS.find((l) => l.value === level.value))
const canCompress = computed(() => doc.value && !busy.value)

async function onFile(files) {
  resetSemua(false)
  const file = files[0]
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) {
    error.value = 'Itu bukan PDF 😅'
    return
  }
  try {
    const { buffer, pageCount } = await loadPdfMeta(file)
    doc.value = { buffer, pageCount, name: file.name, size: file.size }
  } catch {
    error.value = 'File gagal dibaca — kemungkinan rusak atau kena password 🔒'
  }
}

function resetSemua(clearDoc = true) {
  token++
  if (clearDoc) doc.value = null
  busy.value = false
  progress.value = { done: 0, total: 0 }
  error.value = ''
  result.value = null
}

async function kompres() {
  if (!canCompress.value) return
  const myToken = ++token
  busy.value = true
  result.value = null
  error.value = ''
  progress.value = { done: 0, total: doc.value.pageCount }
  try {
    const bytes = await compressPdf(doc.value.buffer, {
      dpi: chosen.value.dpi,
      quality: chosen.value.quality,
      isCancelled: () => myToken !== token,
      onPage: ({ done, total }) => {
        if (myToken === token) progress.value = { done, total }
      },
    })
    if (!bytes || myToken !== token) return
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const base = doc.value.name.replace(/\.pdf$/i, '')
    result.value = {
      blob,
      name: `${base}-kompres.pdf`,
      size: blob.size,
      before: doc.value.size,
    }
  } catch (err) {
    if (myToken === token) error.value = `Waduh, gagal kompres: ${err.message || err}`
  } finally {
    if (myToken === token) busy.value = false
  }
}

function download() {
  if (result.value) downloadBlob(result.value.blob, result.value.name)
}
</script>

<template>
  <section class="py-6">
    <h1 class="text-3xl font-extrabold tracking-tight">🗜️ Kompres PDF</h1>
    <p class="mt-2 opacity-80">
      File kegedean buat di-upload ke Classroom/email kampus? Kecilin di sini. 🔒
    </p>

    <!-- penjelasan jujur -->
    <div
      class="mt-4 rounded-xl border-2 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
    >
      <p class="font-extrabold">⚠️ Baca dulu, biar nggak kaget:</p>
      <p class="mt-1">
        Biar jadi kecil, tiap halaman <strong>dirender ulang jadi gambar</strong>. Artinya teks
        berubah jadi piksel — <strong>nggak bisa dicari, dicopy, atau di-zoom tetep tajam</strong>.
        Cocok buat batesin ukuran upload; <strong>buat arsip/jangan-cetak, jangan pakai ini</strong>.
      </p>
    </div>

    <div class="mt-6" v-if="!doc">
      <UploadZone hint="Klik atau seret 1 PDF ke sini" @files="onFile">
        <template #sub> makin banyak halaman, makin lama prosesnya — sabar ya </template>
      </UploadZone>
      <p
        v-if="error"
        class="mt-4 rounded-lg border-2 border-red-400 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:bg-red-950 dark:text-red-300"
      >
        ⚠️ {{ error }}
      </p>
    </div>

    <div v-else>
      <div
        class="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-ink bg-white p-3 dark:border-paper dark:bg-ink"
      >
        <p class="font-bold">
          📄 {{ doc.name }}
          <span class="text-sm font-normal opacity-70">
            · {{ doc.pageCount }} halaman · {{ formatBytes(doc.size) }}
          </span>
        </p>
        <button
          type="button"
          @click="resetSemua()"
          class="cursor-pointer text-sm font-bold text-red-500 underline hover:text-red-700"
        >
          Ganti file
        </button>
      </div>

      <fieldset class="mt-6">
        <legend class="font-extrabold">Mau sekecil apa? 👇</legend>
        <div class="mt-2 grid gap-3 sm:grid-cols-3">
          <button
            v-for="l in LEVELS"
            :key="l.value"
            type="button"
            @click="level = l.value; result = null"
            class="cursor-pointer rounded-xl border-2 p-4 text-left transition-transform hover:-translate-y-0.5"
            :class="
              level === l.value
                ? 'border-ink bg-accent text-ink'
                : 'border-ink dark:border-paper'
            "
          >
            <span class="text-xl">{{ l.icon }}</span>
            <p class="mt-1 font-extrabold">{{ l.label }}</p>
            <p class="text-xs font-bold opacity-70">{{ l.detail }}</p>
            <p class="mt-1 text-sm opacity-80">{{ l.hint }}</p>
          </button>
        </div>
      </fieldset>

      <button
        type="button"
        @click="kompres"
        :disabled="!canCompress"
        class="mt-6 w-full cursor-pointer rounded-xl border-2 border-ink bg-accent px-6 py-3 text-lg font-extrabold text-ink transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-paper sm:w-auto"
      >
        {{
          busy
            ? `Lagi kompres... ${progress.done}/${progress.total} 🗜️`
            : 'Kompres! 🔥'
        }}
      </button>

      <p
        v-if="error"
        class="mt-4 rounded-lg border-2 border-red-400 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:bg-red-950 dark:text-red-300"
      >
        ⚠️ {{ error }}
      </p>

      <div
        v-if="result"
        class="mt-6 rounded-2xl border-2 border-ink bg-accent p-5 text-ink dark:border-paper"
      >
        <template v-if="result.size < result.before">
          <h2 class="text-lg font-extrabold">
            ✅ Beres! {{ Math.round((1 - result.size / result.before) * 100) }}% lebih kecil 🎉
          </h2>
          <p class="mt-1 text-sm">
            {{ formatBytes(result.before) }} → {{ formatBytes(result.size) }} ·
            {{ doc.pageCount }} halaman
          </p>
        </template>
        <template v-else>
          <h2 class="text-lg font-extrabold">😅 Waduh, malah nggak mengecil.</h2>
          <p class="mt-1 text-sm">
            {{ formatBytes(result.before) }} → {{ formatBytes(result.size) }} — file aslinya
            udah kecil banget kayaknya. Coba level <strong>Kecil banget</strong>, atau skip aja
            ya.
          </p>
        </template>
        <button
          type="button"
          @click="download"
          class="mt-4 cursor-pointer rounded-xl border-2 border-ink bg-white px-6 py-3 font-extrabold transition-transform hover:-translate-y-0.5 dark:border-paper dark:bg-ink dark:text-paper"
        >
          ⬇️ Download
        </button>
      </div>
    </div>
  </section>
</template>
