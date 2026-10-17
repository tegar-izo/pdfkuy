<script setup>
import { computed, ref } from 'vue'
import UploadZone from '../components/UploadZone.vue'
import { formatBytes, loadPdfMeta, mergePdfs, downloadBlob } from '../lib/pdf'

const files = ref([])
const errors = ref([])
const busy = ref(false)
const result = ref(null)

let nextId = 1

const totalPages = computed(() => files.value.reduce((sum, f) => sum + f.pages, 0))
const totalSize = computed(() => files.value.reduce((sum, f) => sum + f.size, 0))
const canMerge = computed(() => files.value.length >= 2 && !busy.value)

async function addFiles(incoming) {
  errors.value = []
  for (const file of incoming) {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      errors.value.push(`${file.name} bukan PDF`)
      continue
    }
    const dup = files.value.some(
      (f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified,
    )
    if (dup) {
      errors.value.push(`${file.name} udah ada di daftar, dilewati ya.`)
      continue
    }
    try {
      const { buffer, pageCount } = await loadPdfMeta(file)
      files.value.push({
        id: nextId++,
        file,
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        buffer,
        pages: pageCount,
      })
    } catch {
      errors.value.push(
        `${file.name} gagal dibaca — kemungkinan rusak atau kena password`,
      )
    }
  }
  // hasil merge lama jadi nggak relevan kalau daftar file berubah
  result.value = null
}

function removeFile(id) {
  files.value = files.value.filter((f) => f.id !== id)
  result.value = null
}

function moveFile(index, dir) {
  const target = index + dir
  if (target < 0 || target >= files.value.length) return
  const list = files.value
  ;[list[index], list[target]] = [list[target], list[index]]
  result.value = null
}

function suggestName() {
  const base = (name) => name.replace(/\.pdf$/i, '')
  const names = files.value.map((f) => base(f.name))
  if (names.length === 2) return `${names[0]}+${names[1]}.pdf`
  return `${names[0]}+${names.length - 1} lainnya.pdf`
}

async function mergeNow() {
  if (!canMerge.value) return
  busy.value = true
  result.value = null
  try {
    const bytes = await mergePdfs(files.value)
    const blob = new Blob([bytes], { type: 'application/pdf' })
    result.value = {
      url: URL.createObjectURL(blob),
      name: suggestName(),
      size: blob.size,
      pages: totalPages.value,
    }
  } catch (err) {
    errors.value.push(`Waduh, gagal digabung: ${err.message || err}. Coba urutkan ulang file-nya.`)
  } finally {
    busy.value = false
  }
}

function download() {
  if (!result.value) return
  const a = document.createElement('a')
  a.href = result.value.url
  a.download = result.value.name
  a.click()
}

function resetSemua() {
  files.value = []
  errors.value = []
  result.value = null
}
</script>

<template>
  <section class="py-6">
    <h1 class="text-3xl font-extrabold tracking-tight"><MIcon name="layers" /> Gabung PDF</h1>
    <p class="mt-2 opacity-80">
      Taro beberapa PDF, urutin sesuai keinginan, terus gabung jadi satu file. Semuanya lokal di
      browser kamu.
    </p>

    <div class="mt-6">
      <UploadZone multiple hint="Klik atau seret PDF ke sini" @files="addFiles">
        <template #sub>bisa pilih banyak file sekaligus (Ctrl/Cmd + klik)</template>
      </UploadZone>
    </div>

    <ul v-if="errors.length" class="mt-4 space-y-1">
      <li
        v-for="(msg, i) in errors"
        :key="i"
        class="rounded-lg border-2 border-red-400 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:bg-red-950 dark:text-red-300"
      >
        <MIcon name="warning" /> {{ msg }}
      </li>
    </ul>

    <div v-if="files.length" class="mt-6">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-extrabold">
          Urutan file ({{ files.length }} file, {{ totalPages }} halaman,
          {{ formatBytes(totalSize) }})
        </h2>
        <button
          type="button"
          @click="resetSemua"
          class="cursor-pointer text-sm font-bold text-red-500 underline hover:text-red-700"
        >
          Hapus semua
        </button>
      </div>

      <ol class="space-y-2">
        <li
          v-for="(f, i) in files"
          :key="f.id"
          class="flex items-center gap-3 rounded-xl border-2 border-ink bg-white p-3 dark:border-paper dark:bg-ink"
        >
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand font-extrabold text-white"
          >
            {{ i + 1 }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate font-bold">{{ f.name }}</p>
            <p class="text-sm opacity-70">{{ f.pages }} halaman · {{ formatBytes(f.size) }}</p>
          </div>
          <div class="flex shrink-0 gap-1">
            <button
              type="button"
              @click="moveFile(i, -1)"
              :disabled="i === 0"
              aria-label="Naikkan urutan"
              class="cursor-pointer rounded-lg border-2 border-ink px-2 py-1 font-bold disabled:cursor-not-allowed disabled:opacity-30 dark:border-paper"
            >
              <MIcon name="arrow_upward" />
            </button>
            <button
              type="button"
              @click="moveFile(i, 1)"
              :disabled="i === files.length - 1"
              aria-label="Turunkan urutan"
              class="cursor-pointer rounded-lg border-2 border-ink px-2 py-1 font-bold disabled:cursor-not-allowed disabled:opacity-30 dark:border-paper"
            >
              <MIcon name="arrow_downward" />
            </button>
            <button
              type="button"
              @click="removeFile(f.id)"
              aria-label="Hapus file"
              class="cursor-pointer rounded-lg border-2 border-ink px-2 py-1 font-bold hover:bg-red-500 hover:text-white dark:border-paper"
            >
              <MIcon name="close" />
            </button>
          </div>
        </li>
      </ol>

      <button
        type="button"
        @click="mergeNow"
        :disabled="!canMerge"
        class="mt-6 w-full cursor-pointer rounded-xl border-2 border-ink bg-accent px-6 py-3 text-lg font-extrabold text-ink transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-paper sm:w-auto"
      >
        {{ busy ? 'Lagi nyatuin PDF-nya...' : 'Gabungkan!' }}
      </button>
      <p v-if="files.length === 1" class="mt-2 text-sm opacity-70">
        Tambah minimal 1 file lagi ya.
      </p>
    </div>

    <div
      v-if="result"
      class="mt-6 rounded-2xl border-2 border-ink bg-accent p-5 text-ink dark:border-paper"
    >
      <h2 class="text-lg font-extrabold"><MIcon name="check_circle" /> Beres! File gabungan udah jadi.</h2>
      <p class="mt-1 text-sm">
        {{ result.name }} · {{ result.pages }} halaman · {{ formatBytes(result.size) }}
        <span v-if="totalSize">
          ({{ formatBytes(totalSize) }} → {{ formatBytes(result.size) }})
        </span>
      </p>
      <button
        type="button"
        @click="download"
        class="mt-4 cursor-pointer rounded-xl border-2 border-ink bg-white px-6 py-3 font-extrabold transition-transform hover:-translate-y-0.5 dark:border-paper dark:bg-ink dark:text-paper"
      >
        <MIcon name="download" /> Download
      </button>
    </div>
  </section>
</template>
