<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import UploadZone from '../components/UploadZone.vue'
import { formatBytes, loadPdfMeta, stampPageNumbers, downloadBlob } from '../lib/pdf'
import { renderThumbnails } from '../lib/thumbnails'

const doc = ref(null) // { buffer, pageCount, name, size }
const thumb = ref(null) // dataURL halaman 1 buat preview
const busy = ref(false)
const error = ref('')
const result = ref(null)

// opsi
const position = ref('bottom-center')
const format = ref('n')
const size = ref(11)
const bold = ref(false)
const color = ref('black')
const start = ref(1)
const skipFirst = ref(false)

const POSITIONS = [
  { value: 'top-left', label: '↖ Atas kiri' },
  { value: 'top-center', label: '↑ Atas tengah' },
  { value: 'top-right', label: '↗ Atas kanan' },
  { value: 'bottom-left', label: '↙ Bawah kiri' },
  { value: 'bottom-center', label: '↓ Bawah tengah' },
  { value: 'bottom-right', label: '↘ Bawah kanan' },
]

const SIZES = [
  { value: 9, label: 'S' },
  { value: 11, label: 'M' },
  { value: 14, label: 'L' },
]

let renderToken = 0

onBeforeUnmount(() => {
  renderToken++
})

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
      if (token === renderToken) error.value = 'Preview gagal dirender 😢 (nomor tetap bisa ditempel).'
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

// nomor yang bakal muncul di halaman 1 (sesuai start & skipFirst)
const sampleNumber = computed(() => start.value + (skipFirst.value ? 1 : 0))

const sampleText = computed(() => {
  const n = sampleNumber.value
  const total = doc.value?.pageCount ?? 1
  if (format.value === 'slash') return `${n} / ${total}`
  if (format.value === 'label') return `Halaman ${n}`
  return `${n}`
})

// posisi overlay di kotak preview (persen dari tepi)
const overlayStyle = computed(() => {
  const [vertical, horizontal] = position.value.split('-')
  const style = { fontSize: `${size.value}px` }
  style[vertical] = '5%'
  if (horizontal === 'left') { style.left = '8%' }
  else if (horizontal === 'right') { style.right = '8%' }
  else { style.left = '50%' }
  if (horizontal === 'center') style.transform = 'translateX(-50%)'
  return style
})

const allSkipped = computed(() => skipFirst.value && doc.value?.pageCount === 1)
const canStamp = computed(() => doc.value && !busy.value && !allSkipped.value)

async function tempel() {
  if (!canStamp.value) return
  busy.value = true
  result.value = null
  error.value = ''
  try {
    const bytes = await stampPageNumbers(doc.value.buffer, {
      position: position.value,
      format: format.value,
      size: size.value,
      bold: bold.value,
      color: color.value,
      start: start.value,
      skipFirst: skipFirst.value,
    })
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const base = doc.value.name.replace(/\.pdf$/i, '')
    const terpasang = skipFirst.value ? doc.value.pageCount - 1 : doc.value.pageCount
    result.value = {
      blob,
      name: `${base}-bernomor.pdf`,
      size: blob.size,
      pages: doc.value.pageCount,
      terpasang,
    }
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
    <h1 class="text-3xl font-extrabold tracking-tight">🔢 Nomor Halaman</h1>
    <p class="mt-2 opacity-80">
      Tempelin nomor halaman otomatis di semua halaman — biar dosenmu nggak bilang "halamannya di
      mana?!". 🔒
    </p>

    <div class="mt-6" v-if="!doc">
      <UploadZone hint="Klik atau seret 1 PDF ke sini" @files="onFile">
        <template #sub> cocok buat laporan / skripsi sebelum dikumpulkan </template>
      </UploadZone>
      <p
        v-if="error"
        class="mt-4 rounded-lg border-2 border-red-400 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:bg-red-950 dark:text-red-300"
      >
        ⚠️ {{ error }}
      </p>
    </div>

    <div v-else class="mt-6 grid gap-6 lg:grid-cols-[1fr_260px]">
      <!-- panel opsi -->
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

        <fieldset>
          <legend class="font-extrabold">Posisi nomornya di mana? 👇</legend>
          <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              v-for="p in POSITIONS"
              :key="p.value"
              type="button"
              @click="position = p.value; result = null"
              class="cursor-pointer rounded-lg border-2 px-2 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5"
              :class="
                position === p.value
                  ? 'border-ink bg-accent text-ink'
                  : 'border-ink dark:border-paper'
              "
            >
              {{ p.label }}
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend class="font-extrabold">Format tulisan</legend>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="f in [
                { value: 'n', label: '1' },
                { value: 'slash', label: '1 / ' + doc.pageCount },
                { value: 'label', label: 'Halaman 1' },
              ]"
              :key="f.value"
              type="button"
              @click="format = f.value; result = null"
              class="cursor-pointer rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold dark:border-paper"
              :class="format === f.value ? 'bg-accent text-ink' : ''"
            >
              {{ f.label }}
            </button>
          </div>
        </fieldset>

        <div class="flex flex-wrap items-end gap-x-6 gap-y-4">
          <fieldset>
            <legend class="font-bold">Ukuran huruf</legend>
            <div class="mt-1 flex gap-1">
              <button
                v-for="s in SIZES"
                :key="s.value"
                type="button"
                @click="size = s.value; result = null"
                class="cursor-pointer rounded-lg border-2 border-ink px-3 py-1 text-sm font-bold dark:border-paper"
                :class="size === s.value ? 'bg-accent text-ink' : ''"
              >
                {{ s.label }}
              </button>
            </div>
          </fieldset>

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

          <label class="text-sm font-bold">
            Mulai dari nomor
            <input
              v-model.number="start"
              type="number"
              min="1"
              class="mt-1 block w-24 rounded-lg border-2 border-ink bg-white px-2 py-1.5 dark:border-paper dark:bg-ink"
              @change="result = null"
            />
          </label>

          <label class="flex cursor-pointer items-center gap-2 text-sm font-bold">
            <input v-model="bold" type="checkbox" class="h-4 w-4" @change="result = null" />
            Huruf tebal
          </label>

          <label class="flex cursor-pointer items-center gap-2 text-sm font-bold">
            <input v-model="skipFirst" type="checkbox" class="h-4 w-4" @change="result = null" />
            Lewati halaman 1
          </label>
        </div>

        <p v-if="allSkipped" class="text-sm font-bold text-red-500">
          PDF-nya cuma 1 halaman, kalo dilewati ya nggak ada nomornya 😅
        </p>

        <button
          type="button"
          @click="tempel"
          :disabled="!canStamp"
          class="w-full cursor-pointer rounded-xl border-2 border-ink bg-accent px-6 py-3 text-lg font-extrabold text-ink transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-paper sm:w-auto"
        >
          {{ busy ? 'Lagi nempel nomor... 🔢' : 'Tempel nomornya! 🔥' }}
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
            {{ result.name }} · {{ result.terpasang }} nomor terpasang ·
            {{ formatBytes(result.size) }}
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
          class="relative mt-2 aspect-[3/4] overflow-hidden rounded-xl border-2 border-ink bg-white dark:border-paper"
        >
          <img v-if="thumb" :src="thumb" alt="Preview halaman 1" class="h-full w-full object-contain" />
          <span v-else class="absolute inset-0 flex items-center justify-center text-3xl opacity-40">
            ⏳
          </span>
          <span
            v-if="!skipFirst || doc.pageCount > 1"
            class="absolute font-bold"
            :class="[
              color === 'white' ? 'text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.9)]' : 'text-black',
              bold ? 'font-extrabold' : '',
            ]"
            :style="overlayStyle"
          >
            {{ skipFirst ? '(halaman 1 dilewati)' : sampleText }}
          </span>
        </div>
        <p class="mt-2 text-xs opacity-70">
          Kira-kira segini nanti penempatannya — pas diunduh dihitung beneran sesuai ukuran teks
          aslinya.
        </p>
      </aside>
    </div>
  </section>
</template>
