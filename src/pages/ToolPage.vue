<script setup>
import { useRoute } from 'vue-router'
import { tools } from '../router'

const route = useRoute()
const tool = tools.find((t) => t.name === route.name)
</script>

<template>
  <section class="py-10 text-center">
    <MIcon :name="tool.icon" class="text-6xl" />
    <h1 class="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{{ tool.title }}</h1>
    <p class="mx-auto mt-3 max-w-xl text-lg opacity-80">{{ tool.tagline }}</p>

    <div
      class="mx-auto mt-8 max-w-xl rounded-2xl border-2 border-dashed border-ink p-8 dark:border-paper"
    >
      <p class="text-2xl"><MIcon name="construction" /></p>
      <p class="mt-2 text-lg font-extrabold">Lagi dibikin, santuy dulu ya.</p>
      <p class="mt-1 text-sm opacity-70">
        Ini fitur <strong>Milestone {{ tool.milestone }}</strong> di roadmap pdfkuy. Cek lagi
        nanti, Insyaallah udah jadi.
      </p>
    </div>

    <RouterLink
      to="/"
      class="mt-8 inline-block rounded-xl border-2 border-ink bg-accent px-5 py-2 font-extrabold text-ink transition-transform hover:-translate-y-0.5 dark:border-paper"
    >
      <MIcon name="arrow_back" /> Balik ke daftar tools
    </RouterLink>
  </section>
</template>
