<script setup>
import { usePwaUpdate } from '../composables/usePwaUpdate'

const { needRefresh, offlineReady, applyUpdate, dismissRefresh, dismissOfflineReady } =
  usePwaUpdate()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="needRefresh"
      class="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-lg flex-col gap-3 rounded-2xl border-2 border-ink bg-accent p-4 text-ink shadow-chunky sm:flex-row sm:items-center"
      role="status"
    >
      <p class="flex-1 text-sm font-bold">
        <MIcon name="system_update_alt" /> Ada versi baru pdfkuy. Muat biar fitur terbaru kepasang.
      </p>
      <div class="flex items-center gap-2">
        <button
          class="rounded-xl border-2 border-ink bg-ink px-3 py-1.5 text-sm font-bold text-paper transition-transform hover:-translate-y-0.5"
          @click="applyUpdate"
        >
          Muat versi baru
        </button>
        <button
          class="rounded-xl border-2 border-ink px-3 py-1.5 text-sm font-bold transition-transform hover:-translate-y-0.5"
          @click="dismissRefresh"
        >
          Nanti
        </button>
      </div>
    </div>

    <div
      v-else-if="offlineReady"
      class="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-lg items-center gap-3 rounded-2xl border-2 border-ink bg-white p-4 shadow-chunky dark:border-paper dark:bg-ink"
      role="status"
    >
      <p class="flex-1 text-sm font-bold">
        <MIcon name="cloud_done" /> Udah kepasang — pdfkuy sekarang bisa dibuka tanpa internet.
      </p>
      <button
        class="rounded-xl border-2 border-ink px-3 py-1.5 text-sm font-bold dark:border-paper"
        @click="dismissOfflineReady"
      >
        Oke
      </button>
    </div>
  </Teleport>
</template>
