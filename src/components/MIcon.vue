<script setup>
/**
 * Ikon tunggal di seluruh app.
 *
 * Default: ligature Material Symbols Rounded (FILL 1) dari Google Fonts.
 * Kalau nama ikonnya nggak ada di Material, lempar `path` (data path SVG 24x24)
 * — komponen ini otomatis render SVG instead.
 */
defineProps({
  /** nama ligature Material Symbols, mis. "content_cut" */
  name: { type: String, default: '' },
  /** fallback SVG: isi atribut d="..." dari satu <path> */
  path: { type: String, default: '' },
  viewBox: { type: String, default: '0 0 24 24' },
  /** kalau diisi, ikon dianggap bermakna (dibaca screen reader) */
  label: { type: String, default: '' },
})
</script>

<template>
  <span
    class="m-icon"
    :role="label ? 'img' : null"
    :aria-label="label || null"
    :aria-hidden="label ? null : 'true'"
  >
    <svg
      v-if="path"
      :viewBox="viewBox"
      fill="currentColor"
      focusable="false"
      aria-hidden="true"
    >
      <path :d="path" />
    </svg>
    <span v-else class="material-symbols-rounded">{{ name }}</span>
  </span>
</template>
