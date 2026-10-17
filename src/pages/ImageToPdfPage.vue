<script setup>
import { computed, ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import UploadZone from '../components/UploadZone.vue'
import { formatBytes, imagesToPdf, downloadBlob } from '../lib/pdf'
import { isImageFile, fileToEmbeddable } from '../lib/images'

const items = ref([]) // [{ id, name, size, width, height, mime, data, converted, previewUrl }]
const pageMode = ref('a4')
const busy = ref(false)
const errors = ref([])
const result = ref(null)

let nextId = 1

const totalSize = computed(() => items.value.reduce((sum, it) => sum + it.size, 0))
const canBuild = computed(() => items.value.length > 0 && !busy.value)

async function addFiles(incoming) {
  result.value = null
  for (const file of incoming) {
    if (!isImageFile(file)) {
      errors.value.push(`${file.name} bukan gambar 😅`)
      continue
    }
    try {
      const emb = await fileToEmbeddable(file)
      items.value.push({
        id: nextId++,
        name: file.name,
        size: file.size,
        width: emb.width,
        height: emb.height,
        mime: emb.mime,
        data: emb.data,
        converted: emb.mime === 'image/jpeg' && !/\.jpe?g$/i.test(file.name),
        previewUrl: URL.createObjectURL(file),
      })
    } catch {
      errors.value.push(`${file.name} gagal dibuka — formatnya nggak kebaca di browser 😢`)
    }
  }
}

function removeItem(id) {
  const i = items.value.findIndex((it) => it.id === id)
  if (i >= 0) URL.revokeObjectURL(items.value[i].previewUrl)
  items.value = items.value.filter((it) => it.id !== id)
  result.value = null
}

function pindah(id, delta) {
  const i = items.value.findIndex((it) => it.id === id)
  const target = i + delta
  if (i < 0 || target < 0 || target >= items.value.length) return
  const list = items.value
  ;[list[i], list[target]] = [list[target], list[i]]
  result.value = null
}

function resetSemua() {
  for (const it of items.value) URL.revokeObjectURL(it.previewUrl)
  items.value = []
  errors.value = []
  result.value = null
}

function suggestName() {
  const base = (name) => name.replace(/\.[^.]+$/, '')
  const names = items.value.map((it) => base(it.name))
  if (names.length === 1) return `${names[0]}.pdf`
  if (names.length === 2) return `${names[0]}+${names[1]}.pdf`
  return `${names[0]}+${names.length - 1} lainnya.pdf`
}

async function bangun() {
  if (!canBuild.value) return
  busy.value = true
  result.value = null
  errors.value = errors.value.filter((e) => !e.startsWith('Waduh'))
  try {
    const bytes = await imagesToPdf(items.value, { pageMode: pageMode.value })
    const blob = new Blob([bytes], { type: 'application/pdf' })
    result.value = {
      blob,
      name: suggestName(),
      size: blob.size,
      pages: items.value.length,
    }
  } catch (err) {
    errors.value.push(`Waduh, gagal nyusun: ${err.message || err}`)
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
    <h1 class="text-3xl font-extrabold tracking-tight">🖼️ Gambar ke PDF</h1>
    <p class="mt-2 opacity-80">
      Tumpukan foto atau hasil scan tugas → satu PDF rapi, urutannya kamu yang atur. JPG, PNG,
      WebP, semua bisa. 🔒
    </p>

    <div class="mt-6">
      <UploadZone accept="image/*" multiple hint="Klik atau seret gambar ke sini" @files="addFiles">
        <template #sub>bisa pilih banyak sekaligus — JPG, PNG, WebP, GIF</template>
      </UploadZone>
    </div>

    <ul v-if="errors.length" class="mt-4 space-y-1">
      <li
        v-for="(msg, i) in errors"
        :key="i"
        class="rounded-lg border-2 border-red-400 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:bg-red-950 dark:text-red-300"
      >
        ⚠️ {{ msg }}
      </li>
    </ul>

    <template v-if="items.length">
      <div class="mt-6 flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-extrabold">
          {{ items.length }} gambar · {{ formatBytes(totalSize) }}
        </h2>
        <button
          type="button"
          @click="resetSemua"
          class="cursor-pointer text-sm font-bold text-red-500 underline hover:text-red-700"
        >
          Hapus semua
        </button>
      </div>

      <p class="mt-4 text-sm font-bold opacity-70">
        Seret kartu atau pakai ← → buat ngatur urutan.
      </p>

      <VueDraggable
        v-model="items"
        :animation="150"
        class="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
      >
        <div
          v-for="(it, i) in items"
          :key="it.id"
          class="group cursor-grab select-none rounded-xl border-2 border-ink bg-white p-2 transition-transform hover:-translate-y-0.5 active:cursor-grabbing dark:border-paper dark:bg-ink"
        >
          <div class="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
            <img
              :src="it.previewUrl"
              :alt="it.name"
              class="max-h-full max-w-full object-contain"
              draggable="false"
            />
            <span
              class="absolute left-1 top-1 rounded-md bg-brand px-1.5 py-0.5 text-xs font-extrabold text-white"
            >
              {{ i + 1 }}
            </span>
            <span
              v-if="it.converted"
              class="absolute right-1 top-1 rounded-md bg-accent px-1.5 py-0.5 text-xs font-extrabold text-ink"
              title="format ini otomatis diubah ke JPG biar muat di PDF"
            >
              →jpg
            </span>
          </div>
          <p class="mt-2 truncate text-xs font-bold" :title="it.name">{{ it.name }}</p>
          <p class="text-xs opacity-70">{{ it.width }}×{{ it.height }} · {{ formatBytes(it.size) }}</p>
          <div class="mt-1 flex justify-end gap-1">
            <button
              type="button"
              @click.stop="pindah(it.id, -1)"
              :disabled="i === 0"
              aria-label="Geser ke kiri"
              class="cursor-pointer rounded-md border-2 border-ink px-1.5 py-0.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-30 dark:border-paper"
            >
              ←
            </button>
            <button
              type="button"
              @click.stop="pindah(it.id, 1)"
              :disabled="i === items.length - 1"
              aria-label="Geser ke kanan"
              class="cursor-pointer rounded-md border-2 border-ink px-1.5 py-0.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-30 dark:border-paper"
            >
              →
            </button>
            <button
              type="button"
              @click.stop="removeItem(it.id)"
              aria-label="Hapus gambar"
              class="cursor-pointer rounded-md border-2 border-ink px-1.5 py-0.5 text-xs font-bold hover:bg-red-500 hover:text-white dark:border-paper"
            >
              ✕
            </button>
          </div>
        </div>
      </VueDraggable>

      <!-- ukuran halaman -->
      <fieldset class="mt-6">
        <legend class="font-extrabold">Ukuran halaman 👇</legend>
        <div class="mt-2 grid gap-3 sm:grid-cols-2">
          <label
            class="flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4"
            :class="
              pageMode === 'a4'
                ? 'border-ink bg-accent text-ink'
                : 'border-ink dark:border-paper'
            "
          >
            <input v-model="pageMode" type="radio" value="a4" class="mt-1" />
            <span>
              <span class="font-extrabold">A4 (standar tugas)</span>
              <span class="block text-sm opacity-80">Gambar di tengah halaman, ada margin tipis.</span>
            </span>
          </label>
          <label
            class="flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4"
            :class="
              pageMode === 'fit'
                ? 'border-ink bg-accent text-ink'
                : 'border-ink dark:border-paper'
            "
          >
            <input v-model="pageMode" type="radio" value="fit" class="mt-1" />
            <span>
              <span class="font-extrabold">Pas sama gambar</span>
              <span class="block text-sm opacity-80">Halaman sebesar gambar, tanpa margin.</span>
            </span>
          </label>
        </div>
      </fieldset>

      <button
        type="button"
        @click="bangun"
        :disabled="!canBuild"
        class="mt-6 w-full cursor-pointer rounded-xl border-2 border-ink bg-accent px-6 py-3 text-lg font-extrabold text-ink transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-paper sm:w-auto"
      >
        {{ busy ? 'Lagi nyatuin gambar... 🖼️' : 'Jadiin PDF! 🔥' }}
      </button>

      <div
        v-if="result"
        class="mt-6 rounded-2xl border-2 border-ink bg-accent p-5 text-ink dark:border-paper"
      >
        <h2 class="text-lg font-extrabold">✅ Beres! PDF-nya jadi.</h2>
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
    </template>
  </section>
</template>
