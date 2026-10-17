<script setup>
import { tools } from '../router'
</script>

<template>
  <section class="py-10 text-center">
    <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl">
      Urusan PDF? <span class="text-brand dark:text-brand-light">Gas.</span> 🔥
    </h1>
    <p class="mx-auto mt-4 max-w-2xl text-lg opacity-80">
      Gabung, split, kompres, sampe watermark — semuanya jalan di browser kamu.
      Nggak ada upload, nggak ada login, nggak ada drama. 🫡
    </p>
  </section>

  <section>
    <h2 class="mb-4 text-xl font-extrabold">Mau ngapain nih? 👇</h2>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="tool in tools"
        :key="tool.name"
        :to="tool.path"
        class="group flex flex-col gap-2 rounded-2xl border-2 border-ink bg-white p-5 transition-transform hover:-translate-y-1 hover:shadow-chunky dark:border-paper dark:bg-ink"
      >
        <div class="flex items-center justify-between">
          <span class="text-4xl">{{ tool.emoji }}</span>
          <span
            class="rounded-full border-2 border-ink px-2 py-0.5 text-xs font-bold dark:border-paper"
          >
            Milestone {{ tool.milestone }}
          </span>
        </div>
        <h3 class="text-lg font-extrabold group-hover:text-brand dark:group-hover:text-brand-light">
          {{ tool.title }}
        </h3>
        <p class="text-sm opacity-70">{{ tool.tagline }}</p>
      </RouterLink>
    </div>
  </section>
</template>
