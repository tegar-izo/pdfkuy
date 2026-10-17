<script setup>
import { useDarkMode } from '../composables/useDarkMode'

const { isDark, toggle } = useDarkMode()
</script>

<template>
  <button
    type="button"
    @click="toggle"
    :aria-label="isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'"
    class="cursor-pointer rounded-full border-2 border-ink bg-white px-3 py-1.5 text-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 dark:border-paper dark:bg-ink"
  >
    <MIcon :name="isDark ? 'light_mode' : 'dark_mode'" />
  </button>
</template>
