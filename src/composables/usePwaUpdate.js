import { ref, readonly } from 'vue'
import { registerSW } from 'virtual:pwa-register'

// Status deteksi update versi aplikasi.
// - otomatis: tiap jam & tiap kali tab-nya balik ke depan (`checkForUpdate`)
// - manual: tombol "Cek update" di halaman About
const needRefresh = ref(false) // ada versi baru, nunggu konfirmasi user
const offlineReady = ref(false) // precache beres — app udah bisa dipakai offline
const checking = ref(false) // lagi proses cek update
const checkResult = ref(null) // 'uptodate' | 'new-version' | 'error' | 'unsupported'
const lastChecked = ref(null) // Date terakhir selesai dicek

let registration = null

// Font Google di-load waktu HTML diparse — belum keburu di-intercept service worker
// (belum aktif pas kunjungan pertama). Jadi setelah SW aktif & ngontrol halaman,
// font-nya di-fetch ulang lewat SW supaya masuk cache `google-fonts`.
const FONT_CSS = [
  'https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@8..144,100..900&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,1,0&display=block',
]

async function cacheFonts() {
  try {
    const cache = await caches.open('google-fonts')
    if ((await cache.keys()).length) return // udah ada, nggak usah dobel
    for (const url of FONT_CSS) {
      const css = await (await fetch(url)).text()
      const fontUrls = [...css.matchAll(/url\((https:\/\/[^)]+)\)/g)].map((m) => m[1])
      await Promise.all(fontUrls.map((u) => fetch(u).catch(() => {})))
    }
  } catch {
    /* offline atau diblokir — biarin, font cuma pelengkap */
  }
}

async function warmupAfterReady() {
  if (!('serviceWorker' in navigator)) return
  await navigator.serviceWorker.ready
  if (!navigator.serviceWorker.controller) {
    await new Promise((resolve) =>
      navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
    )
  }
  cacheFonts()
}

const updateServiceWorker = registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, reg) {
    registration = reg
    // cek versi baru berkala selama tab aktif (workbox juga handle saat tab balik)
    setInterval(() => {
      if (document.visibilityState === 'visible') checkForUpdate({ silent: true })
    }, 60 * 60 * 1000)
  },
  onNeedRefresh() {
    needRefresh.value = true
  },
  onOfflineReady() {
    offlineReady.value = true
  },
})

// di dev nggak ada SW, jadi jangan dipanggil (ready-nya nggak pernah resolve)
if (import.meta.env.PROD) {
  warmupAfterReady()
  // cek versi baru tiap kali tab-nya balik ke depan (lumrah buat PWA)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !needRefresh.value)
      checkForUpdate({ silent: true })
  })
}

// nunggu SW hasil update selesai di-install, biar hasil ceknya akurat
// ('new-version' berarti ada yang nunggu, bukan sekadar file manifest berubah)
function waitForInstall(reg, timeout = 10000) {
  return new Promise((resolve) => {
    const worker = reg.installing
    if (!worker) return resolve()
    const timer = setTimeout(resolve, timeout)
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' || worker.state === 'redundant') {
        clearTimeout(timer)
        resolve()
      }
    })
  })
}

async function checkForUpdate({ silent = false } = {}) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    if (!silent) checkResult.value = 'unsupported'
    return
  }
  checking.value = true
  if (!silent) checkResult.value = null
  try {
    const reg = registration ?? (await navigator.serviceWorker.getRegistration())
    if (!reg) {
      // belum ke-install sama sekali — bukan "ada update", tapi "belum siap"
      if (!silent) checkResult.value = 'uptodate'
      return
    }
    await reg.update()
    await waitForInstall(reg)
    const hasUpdate = needRefresh.value || !!reg.waiting
    if (!silent) checkResult.value = hasUpdate ? 'new-version' : 'uptodate'
  } catch {
    if (!silent) checkResult.value = 'error'
  } finally {
    checking.value = false
    lastChecked.value = new Date()
  }
}

// pasang SW baru + reload halaman (dipanggil tombol "Muat versi baru")
// catatan: reload-nya di-handle sendiri — di workbox-window, event 'controlling'
// bawaan cuma reload kalau halaman udah dikontrol pas pertama register. Kalau
// tab-nya dibuka sebelum SW aktif (kunjungan pertama), event-nya tetap datang
// tapi nggak pernah reload → versi baru nggak pernah kepasang.
let reloading = false
function applyUpdate() {
  if (reloading) return
  reloading = true
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => window.location.reload(),
      { once: true },
    )
  }
  updateServiceWorker(true)
}

function dismissRefresh() {
  needRefresh.value = false
}

function dismissOfflineReady() {
  offlineReady.value = false
}

export function usePwaUpdate() {
  return {
    needRefresh: readonly(needRefresh),
    offlineReady: readonly(offlineReady),
    checking: readonly(checking),
    checkResult: readonly(checkResult),
    lastChecked: readonly(lastChecked),
    checkForUpdate,
    applyUpdate,
    dismissRefresh,
    dismissOfflineReady,
  }
}
