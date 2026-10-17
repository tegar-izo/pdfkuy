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
          <svg
            class="h-5 w-5 text-brand dark:text-brand-light"
            viewBox="0 0 24 24"
            fill="currentColor"
            fill-rule="evenodd"
            aria-hidden="true"
          >
            <path
              d="M6 2h7.4L19 7.6V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm1.6 7.2a1 1 0 0 0 0 2h6.8a1 1 0 0 0 0-2H7.6Zm0 3.6a1 1 0 0 0 0 2h4.8a1 1 0 0 0 0-2H7.6Z"
            />
          </svg>
        </RouterLink>
        <nav class="flex items-center gap-4">
          <RouterLink
            to="/"
            class="text-sm font-bold hover:text-brand dark:hover:text-brand-light"
          >
            Home
          </RouterLink>
          <RouterLink
            to="/about"
            class="text-sm font-bold hover:text-brand dark:hover:text-brand-light"
          >
            About
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
          <MIcon name="lock" /> <strong>File kamu nggak pernah keluar dari browser.</strong> Semua proses jalan di
          perangkatmu.
        </p>
        <p class="opacity-70">dibikin santuy buat anak teknik</p>
      </div>
    </footer>
  </div>
</template>
