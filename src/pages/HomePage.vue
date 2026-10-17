<script setup>
import { tools } from '../router'
</script>

<template>
  <section class="py-10 text-center">
    <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl">
      Urusan PDF? <span class="text-brand dark:text-brand-light">Gas.</span>
    </h1>
    <p class="mx-auto mt-4 max-w-2xl text-lg opacity-80">
      Gabung, split, kompres, sampe watermark — semuanya jalan di browser kamu.
      Nggak ada upload, nggak ada login, nggak ada drama.
    </p>
  </section>

  <section>
    <h2 class="mb-4 text-xl font-extrabold">Mau ngapain nih?</h2>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="tool in tools"
        :key="tool.name"
        :to="tool.path"
        class="group flex flex-col gap-2 rounded-2xl border-2 border-ink bg-white p-5 transition-transform hover:-translate-y-1 hover:shadow-chunky dark:border-paper dark:bg-ink"
      >
        <span class="text-4xl"><MIcon :name="tool.icon" /></span>
        <h3 class="text-lg font-extrabold group-hover:text-brand dark:group-hover:text-brand-light">
          {{ tool.title }}
        </h3>
        <p class="text-sm opacity-70">{{ tool.tagline }}</p>
      </RouterLink>
    </div>
  </section>

  <section class="mt-12">
    <h2 class="mb-4 text-xl font-extrabold">Kenapa di sini aja?</h2>
    <div class="grid gap-4 sm:grid-cols-3">
      <div class="rounded-2xl border-2 border-ink bg-white p-5 dark:border-paper dark:bg-ink">
        <span class="text-3xl"><MIcon name="lock" /></span>
        <h3 class="mt-2 font-extrabold">File nggak ke mana-mana</h3>
        <p class="mt-1 text-sm opacity-70">
          Semua proses di browser kamu. Nggak ada upload ke server, nggak ada yang baca tugasmu.
        </p>
      </div>
      <div class="rounded-2xl border-2 border-ink bg-white p-5 dark:border-paper dark:bg-ink">
        <span class="text-3xl"><MIcon name="no_accounts" /></span>
        <h3 class="mt-2 font-extrabold">Nggak usah login</h3>
        <p class="mt-1 text-sm opacity-70">
          Buka, pakai, beres. Nggak ada email, akun, OTP, apalagi iklan nyebelin.
        </p>
      </div>
      <div class="rounded-2xl border-2 border-ink bg-white p-5 dark:border-paper dark:bg-ink">
        <span class="text-3xl"><MIcon name="card_giftcard" /></span>
        <h3 class="mt-2 font-extrabold">Gratis selamanya</h3>
        <p class="mt-1 text-sm opacity-70">
          Nggak ada "upgrade ke premium" buat fitur dasar. Semua tools bebas dipakai.
        </p>
      </div>
    </div>
  </section>
</template>
