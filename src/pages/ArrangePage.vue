<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import UploadZone from '../components/UploadZone.vue'
import { formatBytes, loadPdfMeta, arrangePages, downloadBlob } from '../lib/pdf'
import { renderThumbnails } from '../lib/thumbnails'

const doc = ref(null) // { buffer, pageCount, name, size }
const pages = ref([]) // [{ id, srcIndex, rotation, thumb }] — urutan = urutan hasil akhir
const loading = ref(false)
const thumbsLoaded = ref(0)
const busy = ref(false)
const error = ref('')
const result = ref(null)

let nextId = 1
let renderToken = 0

// pindah halaman → hentikan render thumbnail yang masih jalan
onBeforeUnmount(() => {
  renderToken++
})

const rotations = computed(() => pages.value.map((p) => p.rotation).filter((r) => r !== 0))

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
    pages.value = Array.from({ length: pageCount }, (_, i) => ({
      id: nextId++,
      srcIndex: i,
      rotation: 0,
      thumb: null,
    }))
    mulaiRender(buffer)
  } catch {
    error.value = 'File gagal dibaca — kemungkinan rusak atau kena password 🔒'
  }
}

function mulaiRender(buffer) {
  const token = ++renderToken
  loading.value = true
  thumbsLoaded.value = 0
  renderThumbnails(buffer, {
    width: 280,
    isCancelled: () => token !== renderToken,
    onPage: (index, dataUrl) => {
      const page = pages.value.find((p) => p.srcIndex === index)
      if (page) page.thumb = dataUrl
      thumbsLoaded.value += 1
    },
  })
    .catch(() => {
      if (token === renderToken) error.value = 'Preview gagal dirender 😢 (file-nya tetap bisa diproses kok).'
    })
    .finally(() => {
      if (token === renderToken) loading.value = false
    })
}

function resetSemua(clearDoc = true) {
  renderToken++
  if (clearDoc) doc.value = null
  pages.value = []
  loading.value = false
  error.value = ''
  result.value = null
}

function touch() {
  result.value = null
}

function rotate(id) {
  const p = pages.value.find((x) => x.id === id)
  if (p) p.rotation = (p.rotation + 90) % 360
  touch()
}

function pindah(id, delta) {
  const i = pages.value.findIndex((x) => x.id === id)
  const target = i + delta
  if (i < 0 || target < 0 || target >= pages.value.length) return
  const list = pages.value
  ;[list[i], list[target]] = [list[target], list[i]]
  touch()
}

function resetUrutan() {
  pages.value = [...pages.value]
    .sort((a, b) => a.srcIndex - b.srcIndex)
    .map((p) => ({ ...p, rotation: 0 }))
  touch()
}

const bisaSimpan = computed(() => doc.value && pages.value.length > 0 && !busy.value)

async function simpan() {
  if (!bisaSimpan.value) return
  busy.value = true
  result.value = null
  error.value = ''
  try {
    const bytes = await arrangePages(
      doc.value.buffer,
      pages.value.map((p) => ({ srcIndex: p.srcIndex, rotation: p.rotation })),
    )
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const base = doc.value.name.replace(/\.pdf$/i, '')
    result.value = {
      blob,
      name: `${base}-disusun.pdf`,
      size: blob.size,
      pages: pages.value.length,
      diubah: pages.value.some((p, i) => p.srcIndex !== i || p.rotation !== 0),
    }
  } catch (err) {
    error.value = `Waduh, gagal nyusun: ${err.message || err}`
  } finally {
    busy.value = false
  }
}

function download() {
  if (result.value) downloadBlob(result.value.blob, result.value.name)
}

function rotasiStyle(rotation) {
  if (rotation === 0) return undefined
  const scale = rotation === 90 || rotation === 270 ? 0.7 : 1
  return { transform: `rotate(${rotation}deg) scale(${scale})` }
}
</script>

<template>
  <section class="py-6">
    <h1 class="text-3xl font-extrabold tracking-tight">🔄 Susun Halaman</h1>
    <p class="mt-2 opacity-80">
      Geser urutan halaman (drag atau tombol panah) dan muter halaman yang kebalik. Pratinjau
      kecil-kecil di bawah biar nggak salah tuker. 🔒
    </p>

    <div class="mt-6" v-if="!doc">
      <UploadZone hint="Klik atau seret 1 PDF ke sini" @files="onFile">
        <template #sub> cocok buat PDF hasil scan yang halamannya kebalik-kabalik </template>
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
        <div class="flex gap-3 text-sm">
          <button
            type="button"
            @click="resetUrutan"
            class="cursor-pointer font-bold underline hover:text-brand"
          >
            Reset urutan
          </button>
          <button
            type="button"
            @click="resetSemua()"
            class="cursor-pointer font-bold text-red-500 underline hover:text-red-700"
          >
            Ganti file
          </button>
        </div>
      </div>

      <p v-if="loading" class="mt-4 text-sm font-bold opacity-70">
        🖼️ Lagi bikin pratinjau... {{ thumbsLoaded }}/{{ doc.pageCount }} halaman
        <span v-if="thumbsLoaded < doc.pageCount">— santuy dulu ya, bisa langsung disusun kok</span>
      </p>

      <p class="mt-6 font-extrabold">
        Seret kartu buat geser urutan, atau pakai tombol ← →. Mute pakai ↻ 👇
      </p>

      <VueDraggable
        v-model="pages"
        :animation="150"
        class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
      >
        <div
          v-for="(p, i) in pages"
          :key="p.id"
          class="group cursor-grab select-none rounded-xl border-2 border-ink bg-white p-2 transition-transform hover:-translate-y-0.5 active:cursor-grabbing dark:border-paper dark:bg-ink"
        >
          <div class="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
            <img
              v-if="p.thumb"
              :src="p.thumb"
              :style="rotasiStyle(p.rotation)"
              :alt="`Halaman ${p.srcIndex + 1}`"
              class="max-h-full max-w-full rounded-sm shadow-sm transition-transform"
              draggable="false"
            />
            <span v-else class="text-2xl opacity-40">⏳</span>
            <span
              class="absolute left-1 top-1 rounded-md bg-brand px-1.5 py-0.5 text-xs font-extrabold text-white"
            >
              {{ i + 1 }}
            </span>
            <span
              v-if="p.rotation !== 0"
              class="absolute right-1 top-1 rounded-md bg-accent px-1.5 py-0.5 text-xs font-extrabold text-ink"
            >
              {{ p.rotation }}°
            </span>
          </div>
          <div class="mt-2 flex items-center justify-between gap-1">
            <span class="text-xs font-bold opacity-70">hlm {{ p.srcIndex + 1 }}</span>
            <div class="flex gap-1">
              <button
                type="button"
                @click.stop="pindah(p.id, -1)"
                :disabled="i === 0"
                aria-label="Geser ke kiri"
                class="cursor-pointer rounded-md border-2 border-ink px-1.5 py-0.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-30 dark:border-paper"
              >
                ←
              </button>
              <button
                type="button"
                @click.stop="pindah(p.id, 1)"
                :disabled="i === pages.length - 1"
                aria-label="Geser ke kanan"
                class="cursor-pointer rounded-md border-2 border-ink px-1.5 py-0.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-30 dark:border-paper"
              >
                →
              </button>
              <button
                type="button"
                @click.stop="rotate(p.id)"
                aria-label="Putar 90 derajat"
                class="cursor-pointer rounded-md border-2 border-ink px-1.5 py-0.5 text-xs font-bold hover:bg-accent hover:text-ink dark:border-paper"
              >
                ↻
              </button>
            </div>
          </div>
        </div>
      </VueDraggable>

      <p class="mt-4 text-sm font-bold opacity-70">
        {{ rotations.length }} halaman diputar ·
        {{ pages.some((p, i) => p.srcIndex !== i) ? 'urutan udah diubah' : 'urutan masih asli' }}
      </p>

      <button
        type="button"
        @click="simpan"
        :disabled="!bisaSimpan"
        class="mt-4 w-full cursor-pointer rounded-xl border-2 border-ink bg-accent px-6 py-3 text-lg font-extrabold text-ink transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-paper sm:w-auto"
      >
        {{ busy ? 'Lagi nyusun... 🔄' : 'Susun jadi PDF! 🔥' }}
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
        <h2 class="text-lg font-extrabold">✅ Beres!</h2>
        <p class="mt-1 text-sm">
          {{ result.name }} · {{ result.pages }} halaman · {{ formatBytes(result.size) }}
          <template v-if="!result.diubah"> — eh, nggak ada yang berubah sama sekali tuh 😄</template>
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
  </section>
</template>
