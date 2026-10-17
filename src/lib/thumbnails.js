import { pdfjsLib } from './pdfjs-setup'

/**
 * Render thumbnail tiap halaman PDF jadi dataURL JPEG.
 * @param {ArrayBuffer} buffer — PDF asli (di-copy dulu; pdf.js men-detach buffer yang dikirim)
 * @param {object} opts
 * @param {number} [opts.width] — lebar render dalam px (2x buat layar retina)
 * @param {(index: number, dataUrl: string) => void} [opts.onPage] — dipanggil per halaman, bisa lebih dulu datang lebih cepat
 * @param {() => boolean} [opts.isCancelled] — kalau balik true, proses berhenti di tengah jalan
 * @param {number[]} [opts.only] — render halaman tertentu aja (index 0-based); default semua
 */
export async function renderThumbnails(buffer, { width = 280, onPage, isCancelled, only } = {}) {
  // pdf.js me-transfer (men-detach) ArrayBuffer yang dikasih ke `data` — makanya di-copy
  const loadingTask = pdfjsLib.getDocument({ data: buffer.slice(0) })
  const doc = await loadingTask.promise
  try {
    const targets = only ?? Array.from({ length: doc.numPages }, (_, i) => i)
    for (const i0 of targets) {
      if (isCancelled?.()) return
      const page = await doc.getPage(i0 + 1)
      const base = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: width / base.width })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const ctx = canvas.getContext('2d', { alpha: false })
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      await page.render({ canvas, viewport }).promise
      onPage?.(i0, canvas.toDataURL('image/jpeg', 0.82))
      page.cleanup()
    }
  } finally {
    // di pdfjs v6, destroy() ada di loadingTask, bukan di PDFDocumentProxy.
    // aman buat shared workerPort: PDFWorker.#webWorker null → port nggak ikut terminate.
    try {
      await loadingTask.destroy()
    } catch {
      /* gagal destroy nggak boleh nutupin error asli */
    }
  }
}
