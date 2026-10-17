<script setup>
import { ref } from 'vue'

const props = defineProps({
  accept: { type: String, default: '.pdf' },
  multiple: { type: Boolean, default: false },
  hint: { type: String, default: 'Klik atau seret file ke sini' },
})

const emit = defineEmits(['files'])

const inputEl = ref(null)
const isDragging = ref(false)

function openPicker() {
  inputEl.value?.click()
}

function onInputChange(event) {
  const files = Array.from(event.target.files || [])
  if (files.length) emit('files', files)
  event.target.value = ''
}

function onDrop(event) {
  isDragging.value = false
  const files = Array.from(event.dataTransfer?.files || [])
  if (files.length) emit('files', files)
}
</script>

<template>
  <div
    role="button"
    tabindex="0"
    @click="openPicker"
    @keydown.enter="openPicker"
    @keydown.space.prevent="openPicker"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
    class="cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors"
    :class="
      isDragging
        ? 'border-brand bg-brand/10'
        : 'border-ink hover:border-brand dark:border-paper'
    "
  >
    <p class="text-3xl">📄</p>
    <p class="mt-2 font-extrabold">{{ props.hint }}</p>
    <p class="mt-1 text-sm opacity-70">
      <slot name="sub" />
    </p>
    <input
      ref="inputEl"
      type="file"
      :accept="props.accept"
      :multiple="props.multiple"
      class="hidden"
      @change="onInputChange"
    />
  </div>
</template>
