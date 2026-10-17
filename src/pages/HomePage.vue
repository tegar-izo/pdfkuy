<script setup>
import { tools } from '../router'

// gambar-ke-pdf ditandai `featured` di router — jadi kartu hero yang memenuhi
// 2 kolom x 2 row, tools lain ngalir di sisanya
const hero = tools.find((t) => t.featured)
const lainnya = tools.filter((t) => !t.featured)

const keunggulan = [
  'Bisa langsung dari kamera atau galeri',
  'Urutan gambar bebas diatur',
  'Mode A4 atau nge-fit ukuran gambar',
]
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
    <div class="grid gap-4 sm:auto-rows-fr sm:grid-cols-2 lg:grid-cols-3">
      <!-- kartu hero: 2 kolom x 2 row, nemenin 2 row tools lain -->
      <RouterLink
        v-if="hero"
        :to="hero.path"
        class="group relative flex flex-col justify-between gap-5 overflow-hidden rounded-2xl border-2 border-ink bg-brand p-6 text-white shadow-chunky transition-transform hover:-translate-y-1 hover:shadow-chunky sm:col-span-2 lg:col-span-2 lg:row-span-2"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <span
              class="inline-block rounded-full border-2 border-ink bg-accent px-3 py-0.5 text-xs font-extrabold uppercase tracking-wide text-ink"
            >
              <MIcon name="star" /> Fitur unggulan
            </span>
            <h3 class="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
              {{ hero.title }}
            </h3>
            <p class="mt-2 max-w-md text-base opacity-90">{{ hero.tagline }}</p>
          </div>
          <span
            class="text-6xl text-accent transition-transform group-hover:-translate-y-1 group-hover:rotate-6 sm:text-7xl"
          >
            <MIcon :name="hero.icon" />
          </span>
        </div>

        <ul class="grid gap-1.5 text-sm font-bold sm:grid-cols-2">
          <li v-for="poin in keunggulan" :key="poin">
            <MIcon name="check_circle" class="text-accent" /> {{ poin }}
          </li>
        </ul>

        <span
          class="inline-flex w-fit items-center gap-1 rounded-xl border-2 border-ink bg-accent px-4 py-2 text-sm font-extrabold text-ink shadow-chunky-sm transition-transform group-hover:-translate-y-0.5"
        >
          Coba sekarang <MIcon name="arrow_forward" />
        </span>
      </RouterLink>

      <RouterLink
        v-for="tool in lainnya"
        :key="tool.name"
        :to="tool.path"
        class="group flex h-full flex-col gap-2 rounded-2xl border-2 border-ink bg-white p-5 transition-transform hover:-translate-y-1 hover:shadow-chunky dark:border-paper dark:bg-ink"
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
