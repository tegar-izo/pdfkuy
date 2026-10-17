<script setup>
import { computed, ref } from 'vue'
import UploadZone from '../components/UploadZone.vue'
import {
  formatBytes,
  loadPdfMeta,
  slicePdf,
  parsePageRange,
  downloadBlob,
} from '../lib/pdf'

const doc = ref(null) // { buffer, pageCount, name, size }
const mode = ref('extract') // 'extract' | 'delete'
const selected = ref([]) // index 0-based yang dipilih user
const rangeText = ref('')
const rangeError = ref('')
const busy = ref(false)
const error = ref('')
const result = ref(null)

const allIndices = computed(() =>
  doc.value ? Array.from({ length: doc.value.pageCount }, (_, i) => i) : [],
)

// halaman yang ikut ke hasil, tergantung mode
const keepIndices = computed(() =>
  mode.value === 'extract'
    ? selected.value
    : allIndices.value.filter((i) => !selected.value.includes(i)),
)

const canRun = computed(
  () => doc.value && !busy.value && selected.value.length > 0 && keepIndices.value.length > 0,
)

async function onFile(files) {
  resetSemua(false)
  const file = files[0]
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) {
    error.value = 'Itu bukan PDF'
    return
  }
  try {
    const { buffer, pageCount } = await loadPdfMeta(file)
    doc.value = { buffer, pageCount, name: file.name, size: file.size }
  } catch {
    error.value = 'File gagal dibaca — kemungkinan rusak atau kena password'
  }
}

function resetSemua(clearDoc = true) {
  if (clearDoc) doc.value = null
  selected.value = []
  rangeText.value = ''
  rangeError.value = ''
  error.value = ''
  result.value = null
}

function isSelected(i) {
  return selected.value.includes(i)
}

function togglePage(i) {
  selected.value = isSelected(i)
    ? selected.value.filter((x) => x !== i)
    : [...selected.value, i].sort((a, b) => a - b)
  result.value = null
}

function pilihSemua() {
  selected.value = [...allIndices.value]
  result.value = null
}

function kosongkan() {
  selected.value = []
  result.value = null
}

function applyRange() {
  rangeError.value = ''
  if (!rangeText.value.trim()) {
    rangeError.value = 'Isi dulu range-nya ya, contoh: 1-3, 7'
    return
  }
  try {
    selected.value = parsePageRange(rangeText.value, doc.value.pageCount)
    result.value = null
  } catch (err) {
    rangeError.value = err.message
  }
}

function switchMode(newMode) {
  mode.value = newMode
  result.value = null
}

async function potong() {
  if (!canRun.value) return
  busy.value = true
  result.value = null
  error.value = ''
  try {
    const bytes = await slicePdf(doc.value.buffer, keepIndices.value)
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const base = doc.value.name.replace(/\.pdf$/i, '')
    result.value = {
      blob,
      name: mode.value === 'extract' ? `${base}-potongan.pdf` : `${base}-sisa.pdf`,
      size: blob.size,
      pages: keepIndices.value.length,
    }
  } catch (err) {
    error.value = `Waduh, gagal motong: ${err.message || err}`
  } finally {
    busy.value = false
  }
}

function download() {
  if (!result.value) return
  downloadBlob(result.value.blob, result.value.name)
}
</script>

<template>
  <section class="py-6">
    <h1 class="text-3xl font-extrabold tracking-tight"><MIcon name="content_cut" /> Split PDF</h1>
    <p class="mt-2 opacity-80">
      Mau ambil sebagian halaman aja, atau buang halaman yang nggak perlu? Pilih-pilih halaman
      terus potong. Semua proses lokal.
    </p>

    <div class="mt-6" v-if="!doc">
      <UploadZone hint="Klik atau seret 1 PDF ke sini" @files="onFile">
        <template #sub> PDF-nya dipotong, bukan digabung — jadi satu file aja dulu ya </template>
      </UploadZone>
      <p
        v-if="error"
        class="mt-4 rounded-lg border-2 border-red-400 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:bg-red-950 dark:text-red-300"
      >
        <MIcon name="warning" /> {{ error }}
      </p>
    </div>

    <div v-else>
      <div
        class="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-ink bg-white p-3 dark:border-paper dark:bg-ink"
      >
        <p class="font-bold">
          <MIcon name="picture_as_pdf" /> {{ doc.name }}
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

      <!-- mode -->
      <div class="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          @click="switchMode('extract')"
          class="cursor-pointer rounded-xl border-2 p-4 text-left transition-transform hover:-translate-y-0.5"
          :class="
            mode === 'extract'
              ? 'border-ink bg-accent text-ink'
              : 'border-ink opacity-60 dark:border-paper'
          "
        >
          <span class="text-xl"><MIcon name="content_cut" /></span>
          <p class="mt-1 font-extrabold">Ambil halaman terpilih</p>
          <p class="text-sm">Halaman yang kamu pilih jadi file baru.</p>
        </button>
        <button
          type="button"
          @click="switchMode('delete')"
          class="cursor-pointer rounded-xl border-2 p-4 text-left transition-transform hover:-translate-y-0.5"
          :class="
            mode === 'delete'
              ? 'border-ink bg-accent text-ink'
              : 'border-ink opacity-60 dark:border-paper'
          "
        >
          <span class="text-xl"><MIcon name="delete" /></span>
          <p class="mt-1 font-extrabold">Buang halaman terpilih</p>
          <p class="text-sm">Halaman yang kamu pilih dibuang, sisanya jadi file baru.</p>
        </button>
      </div>

      <!-- tools pilih cepat -->
      <div class="mt-6 flex flex-wrap items-end gap-2">
        <label class="flex-1 min-w-52">
          <span class="text-sm font-bold">Pilih cepat (contoh: 1-3, 7, 10-12)</span>
          <input
            v-model="rangeText"
            type="text"
            placeholder="1-3, 7, 10-12"
            @keydown.enter="applyRange"
            class="mt-1 w-full rounded-lg border-2 border-ink bg-white px-3 py-2 dark:border-paper dark:bg-ink"
          />
        </label>
        <button
          type="button"
          @click="applyRange"
          class="cursor-pointer rounded-lg border-2 border-ink bg-white px-4 py-2 font-bold dark:border-paper dark:bg-ink"
        >
          Terapkan
        </button>
        <button
          type="button"
          @click="pilihSemua"
          class="cursor-pointer rounded-lg border-2 border-ink bg-white px-4 py-2 font-bold dark:border-paper dark:bg-ink"
        >
          Pilih semua
        </button>
        <button
          type="button"
          @click="kosongkan"
          class="cursor-pointer rounded-lg border-2 border-ink bg-white px-4 py-2 font-bold dark:border-paper dark:bg-ink"
        >
          Kosongkan
        </button>
      </div>
      <p
        v-if="rangeError"
        class="mt-2 rounded-lg border-2 border-red-400 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:bg-red-950 dark:text-red-300"
      >
        <MIcon name="warning" /> {{ rangeError }}
      </p>

      <!-- grid halaman -->
      <p class="mt-6 font-extrabold">Klik halaman buat milih</p>
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          v-for="i in doc.pageCount"
          :key="i"
          type="button"
          @click="togglePage(i - 1)"
          :aria-pressed="isSelected(i - 1)"
          class="h-11 w-11 cursor-pointer rounded-lg border-2 border-ink font-extrabold transition-transform hover:-translate-y-0.5 dark:border-paper"
          :class="isSelected(i - 1) ? 'bg-brand text-white' : 'bg-white dark:bg-ink'"
        >
          {{ i }}
        </button>
      </div>

      <p class="mt-4 font-bold">
        {{ selected.length }} halaman dipilih → hasilnya
        <strong>{{ keepIndices.length }} halaman</strong>
        <span v-if="mode === 'delete' && selected.length === doc.pageCount" class="text-red-500">
          (eh, semua halamamu kebuang tuh)
        </span>
      </p>

      <button
        type="button"
        @click="potong"
        :disabled="!canRun"
        class="mt-4 w-full cursor-pointer rounded-xl border-2 border-ink bg-accent px-6 py-3 text-lg font-extrabold text-ink transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-paper sm:w-auto"
      >
        {{ busy ? 'Lagi motong...' : 'Potong PDF!' }}
      </button>

      <p
        v-if="error"
        class="mt-4 rounded-lg border-2 border-red-400 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:bg-red-950 dark:text-red-300"
      >
        <MIcon name="warning" /> {{ error }}
      </p>

      <div
        v-if="result"
        class="mt-6 rounded-2xl border-2 border-ink bg-accent p-5 text-ink dark:border-paper"
      >
        <h2 class="text-lg font-extrabold"><MIcon name="check_circle" /> Beres! File-nya udah kepotong.</h2>
        <p class="mt-1 text-sm">
          {{ result.name }} · {{ result.pages }} halaman · {{ formatBytes(result.size) }}
        </p>
        <button
          type="button"
          @click="download"
          class="mt-4 cursor-pointer rounded-xl border-2 border-ink bg-white px-6 py-3 font-extrabold transition-transform hover:-translate-y-0.5 dark:border-paper dark:bg-ink dark:text-paper"
        >
          <MIcon name="download" /> Download
        </button>
      </div>
    </div>
  </section>
</template>
