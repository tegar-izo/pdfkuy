import { ref } from 'vue'

const STORAGE_KEY = 'pdfkuy-theme'
const isDark = ref(false)

export function applyTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = saved ? saved === 'dark' : prefersDark
  document.documentElement.classList.toggle('dark', isDark.value)
}

export function useDarkMode() {
  function toggle() {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
  }

  return { isDark, toggle }
}
