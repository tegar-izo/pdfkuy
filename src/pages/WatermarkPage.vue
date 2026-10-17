<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import UploadZone from '../components/UploadZone.vue'
import {
  formatBytes,
  loadPdfMeta,
  stampWatermark,
  sanitizeWatermarkText,
  downloadBlob,
} from '../lib/pdf'
import { renderThumbnails } from '../lib/thumbnails'

const doc = ref(null)
const thumb = ref(null)
const busy = ref(false)
const error = ref('')
const result = ref(null)

// opsi
const text = ref('')
const opacity = ref(25) // persen
const rotation = ref(45)
const mode = ref('center')
const color = ref('black')

const boxEl = ref(null)
const boxWidth = ref(240)

const cleanText = computed(() => sanitizeWatermarkText(text.value).trim())
const adaIsi = computed(() => cleanText.value.length > 0)
const teksDiubah = computed(() => cleanText.value !== text.value.trim() && text.value.trim() !== '')

// ukuran teks center ala pdf-lib (80% lebar) dalam px preview
const centerPreviewSize = computed(() => {
  const ctx = document.createElement('canvas').getContext('2d')
  ctx.font = 'bold 100px Helvetica, Arial, sans-serif'
  const ratio = ctx.measureText(cleanText.value || 'x').width / 100
  return Math.min((boxWidth.value * 0.8) / Math.max(ratio, 0.01), 150 * (boxWidth.value / 595))
})

const TILES = Array.from({ length: 24 }, (_, i) => i)

const overlayStyle = computed(() => ({
  opacity: opacity.value / 100,
  transform: `translate(-50%, -50%) rotate(${-rotation.value}deg)`, // CSS CW, pdf CCW
}))

let renderToken = 0
let resizeObs = null

function ukurBox() {
  if (boxEl.value) boxWidth.value = boxEl.value.clientWidth
}

onMounted(() => {
  ukurBox()
  resizeObs = new ResizeObserver(ukurBox)
  if (boxEl.value) resizeObs.observe(boxEl.value)
})
onBeforeUnmount(() => resizeObs?.disconnect())

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
    const token = ++renderToken
    renderThumbnails(buffer, {
      width: 280,
      only: [0],
      isCancelled: () => token !== renderToken,
      onPage: (_, dataUrl) => {
        if (token === renderToken) thumb.value = dataUrl
      },
    }).catch(() => {
      if (token === renderToken) error.value = 'Preview gagal dirender 😢 (watermark tetap bisa ditempel).'
    })
  } catch {
    error.value = 'File gagal dibaca — kemungkinan rusak atau kena password 🔒'
  }
}

function resetSemua(clearDoc = true) {
  renderToken++
  if (clearDoc) doc.value = null
  thumb.value = null
  error.value = ''
  result.value = null
}

const canStamp = computed(() => doc.value && adaIsi.value && !busy.value)

async function tempel() {
  if (!canStamp.value) return
  busy.value = true
  result.value = null
  error.value = ''
  try {
    const bytes = await stampWatermark(doc.value.buffer, {
      text: cleanText.value,
      opacity: opacity.value / 100,
      rotation: rotation.value,
      mode: mode.value,
      color: color.value,
    })
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const base = doc.value.name.replace(/\.pdf$/i, '')
    result.value = { blob, name: `${base}-watermark.pdf`, size: blob.size, pages: doc.value.pageCount }
  } catch (err) {
    error.value = `Waduh, gagal nempel: ${err.message || err}`
  } finally {
    busy.value = false
  }
}

function download() {
  if (result.value) downloadBlob(result.value.blob, result.value.name)
}
</script>

<template>
  <section class="py-6">
    <h1 class="text-3xl font-extrabold tracking-tight">💧 Watermark</h1>
    <p class="mt-2 opacity-80">
      Cas nama/NIM kamu di tiap halaman — biar file yang tersebar tetap ada jejaknya. 🔒
    </p>

    <div class="mt-6" v-if="!doc">
      <UploadZone hint="Klik atau seret 1 PDF ke sini" @files="onFile">
        <template #sub> watermark-nya nempel ke SEMUA halaman sekaligus </template>
      </UploadZone>
      <p
        v-if="error"
        class="mt-4 rounded-lg border-2 border-red-400 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:bg-red-950 dark:text-red-300"
      >
        ⚠️ {{ error }}
      </p>
    </div>

    <div v-else class="mt-6 grid gap-6 lg:grid-cols-[1fr_260px]">
      <div class="space-y-5">
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

        <label class="block">
          <span class="font-extrabold">Teks watermark 👇</span>
          <input
            v-model="text"
            type="text"
            maxlength="80"
            placeholder="Tegar Izo — 12345678"
            class="mt-2 w-full rounded-lg border-2 border-ink bg-white px-3 py-2.5 text-lg font-bold dark:border-paper dark:bg-ink"
          />
          <span v-if="teksDiubah" class="mt-1 block text-xs font-bold text-amber-600">
            ⚠️ Sebagian karakter nggak didukung PDF, diganti “?” ya.
          </span>
        </label>

        <fieldset>
          <legend class="font-extrabold">Gaya tampil</legend>
          <div class="mt-2 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              @click="mode = 'center'; result = null"
              class="cursor-pointer rounded-xl border-2 p-4 text-left transition-transform hover:-translate-y-0.5"
              :class="mode === 'center' ? 'border-ink bg-accent text-ink' : 'border-ink dark:border-paper'"
            >
              <span class="font-extrabold">Di tengah (satu, gede)</span>
              <span class="block text-sm">Auto sebesar ±80% lebar halaman.</span>
            </button>
            <button
              type="button"
              @click="mode = 'tile'; result = null"
              class="cursor-pointer rounded-xl border-2 p-4 text-left transition-transform hover:-translate-y-0.5"
              :class="mode === 'tile' ? 'border-ink bg-accent text-ink' : 'border-ink dark:border-paper'"
            >
              <span class="font-extrabold">Berulang (nutup halaman)</span>
              <span class="block text-sm">Lebih susah dilepas — khas dokumen resmi.</span>
            </button>
          </div>
        </fieldset>

        <div class="flex flex-wrap items-end gap-x-6 gap-y-4">
          <label class="min-w-52 flex-1 text-sm font-bold">
            Opacity: {{ opacity }}%
            <input
              v-model.number="opacity"
              type="range"
              min="5"
              max="80"
              step="5"
              class="mt-1 w-full accent-violet-600"
              @input="result = null"
            />
          </label>
          <label class="min-w-52 flex-1 text-sm font-bold">
            Rotasi: {{ rotation }}°
            <input
              v-model.number="rotation"
              type="range"
              min="-90"
              max="90"
              step="5"
              class="mt-1 w-full accent-violet-600"
              @input="result = null"
            />
          </label>
          <fieldset>
            <legend class="font-bold">Warna</legend>
            <div class="mt-1 flex gap-1">
              <button
                v-for="c in [
                  { value: 'black', label: '⬛ Hitam' },
                  { value: 'white', label: '⬜ Putih' },
                ]"
                :key="c.value"
                type="button"
                @click="color = c.value; result = null"
                class="cursor-pointer rounded-lg border-2 border-ink px-3 py-1 text-sm font-bold dark:border-paper"
                :class="color === c.value ? 'bg-accent text-ink' : ''"
              >
                {{ c.label }}
              </button>
            </div>
          </fieldset>
        </div>

        <p v-if="!adaIsi" class="text-sm font-bold text-amber-600">
          Isi teks watermarknya dulu ya ✍️
        </p>

        <button
          type="button"
          @click="tempel"
          :disabled="!canStamp"
          class="w-full cursor-pointer rounded-xl border-2 border-ink bg-accent px-6 py-3 text-lg font-extrabold text-ink transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-paper sm:w-auto"
        >
          {{ busy ? 'Lagi nempel watermark... 💧' : 'Tempel watermark! 🔥' }}
        </button>

        <p
          v-if="error"
          class="rounded-lg border-2 border-red-400 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          ⚠️ {{ error }}
        </p>

        <div
          v-if="result"
          class="rounded-2xl border-2 border-ink bg-accent p-5 text-ink dark:border-paper"
        >
          <h2 class="text-lg font-extrabold">✅ Beres!</h2>
          <p class="mt-1 text-sm">
            {{ result.name }} · {{ result.pages }} halaman · {{ formatBytes(result.size) }}
          </p>
          <button
            type="button"
            @click="download"
            class="mt-4 cursor-pointer rounded-xl border-2 border-ink bg-white px-6 py-3 font-extrabold transition-transform hover:-translate-y-0.5 dark:border-paper dark:bg-ink dark:text-paper"
          >
            ⬇️ Download
          </button>
        </div>
      </div>

      <!-- preview -->
      <aside>
        <p class="font-extrabold">Preview (halaman 1)</p>
        <div
          ref="boxEl"
          class="relative mt-2 aspect-[3/4] overflow-hidden rounded-xl border-2 border-ink bg-white dark:border-paper"
        >
          <img v-if="thumb" :src="thumb" alt="Preview halaman 1" class="h-full w-full object-contain" />
          <span v-else class="absolute inset-0 flex items-center justify-center text-3xl opacity-40">
            ⏳
          </span>

          <!-- overlay center -->
          <span
            v-if="adaIsi && mode === 'center'"
            class="absolute left-1/2 top-1/2 whitespace-nowrap font-extrabold"
            :class="color === 'white' ? 'text-white' : 'text-black'"
            :style="[overlayStyle, { fontSize: centerPreviewSize + 'px' }]"
          >
            {{ cleanText }}
          </span>

          <!-- overlay tile -->
          <span
            v-if="adaIsi && mode === 'tile'"
            v-for="t in TILES"
            :key="t"
            class="absolute whitespace-nowrap font-extrabold"
            :class="color === 'white' ? 'text-white' : 'text-black'"
            :style="[
              {
                left: `${(t % 3) * 40 - 10}%`,
                top: `${Math.floor(t / 3) * 14 + 4}%`,
                fontSize: '13px',
                opacity: opacity / 100,
                transform: `rotate(${-rotation}deg)`,
              },
            ]"
          >
            {{ cleanText }}
          </span>
        </div>
        <p class="mt-2 text-xs opacity-70">
          Kira-kira segini — pas diunduh, ukuran & posisi dihitung beneran dari lebar halaman
          aslinya.
        </p>
      </aside>
    </div>
  </section>
</template>
