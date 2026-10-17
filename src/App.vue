<script setup>
import DarkModeToggle from './components/DarkModeToggle.vue'
</script>

<template>
  <div class="min-h-screen bg-paper font-sans text-ink dark:bg-ink dark:text-paper">
    <header class="border-b-2 border-ink dark:border-paper">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <RouterLink to="/" class="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <span class="rounded-lg bg-brand px-2 py-0.5 text-white">pdf</span>
          <span>kuy</span>
          <span aria-hidden="true">📄</span>
        </RouterLink>
        <nav class="flex items-center gap-4">
          <RouterLink
            to="/"
            class="text-sm font-bold hover:text-brand dark:hover:text-brand-light"
          >
            Home
          </RouterLink>
          <DarkModeToggle />
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-8">
      <RouterView />
    </main>

    <footer class="border-t-2 border-ink dark:border-paper">
      <div class="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          🔒 <strong>File kamu nggak pernah keluar dari browser.</strong> Semua proses jalan di
          perangkatmu.
        </p>
        <p class="opacity-70">dibikin santuy buat anak teknik 🤙</p>
      </div>
    </footer>
  </div>
</template>
