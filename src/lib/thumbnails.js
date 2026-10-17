import * as pdfjsLib from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'

// satu worker dipakai seumur aplikasi — pdf.js tidak ikut mematikannya saat doc.destroy()
if (!pdfjsLib.GlobalWorkerOptions.workerPort) {
  pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker()
}

/**
 * Render thumbnail tiap halaman PDF jadi dataURL JPEG.
 * @param {ArrayBuffer} buffer — PDF asli (di-copy dulu; pdf.js men-detach buffer yang dikirim)
 * @param {object} opts
 * @param {number} [opts.width] — lebar render dalam px (2x buat layar retina)
 * @param {(index: number, dataUrl: string) => void} [opts.onPage] — dipanggil per halaman, bisa lebih dulu datang lebih cepat
 * @param {() => boolean} [opts.isCancelled] — kalau balik true, proses berhenti di tengah jalan
 */
export async function renderThumbnails(buffer, { width = 280, onPage, isCancelled } = {}) {
  // pdf.js me-transfer (men-detach) ArrayBuffer yang dikasih ke `data` — makanya di-copy
  const doc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      if (isCancelled?.()) return
      const page = await doc.getPage(i)
      const base = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: width / base.width })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const ctx = canvas.getContext('2d', { alpha: false })
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      await page.render({ canvas, viewport }).promise
      onPage?.(i - 1, canvas.toDataURL('image/jpeg', 0.82))
      page.cleanup()
    }
  } finally {
    await doc.destroy()
  }
}
