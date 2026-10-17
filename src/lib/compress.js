import { pdfjsLib } from './pdfjs-setup'
import { PDFDocument } from 'pdf-lib'

/**
 * Kompres PDF: render ulang tiap halaman jadi JPEG resolusi/kualitas lebih rendah,
 * lalu susun ulang jadi PDF. Hasilnya jauh lebih kecil — tapi teks jadi piksel
 * (nggak bisa dicari/dicopy). Trade-off yang disadari user sejak awal.
 *
 * @param {ArrayBuffer} buffer
 * @param {object} opts
 * @param {number} [opts.dpi] — 72 = layar lama, 150 = masih tajam
 * @param {number} [opts.quality] — 0..1 kualitas JPEG
 * @param {(info: { done: number, total: number }) => void} [opts.onPage]
 * @param {() => boolean} [opts.isCancelled]
 * @returns {Promise<Uint8Array|null>} null kalau dibatalkan
 */
export async function compressPdf(buffer, { dpi = 110, quality = 0.7, onPage, isCancelled } = {}) {
  const doc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise
  try {
    const out = await PDFDocument.create()
    const total = doc.numPages
    for (let i = 1; i <= total; i++) {
      if (isCancelled?.()) return null
      const page = await doc.getPage(i)
      const base = page.getViewport({ scale: 1 }) // ukuran halaman dalam pt (ikut /Rotate)
      const viewport = page.getViewport({ scale: dpi / 72 })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const ctx = canvas.getContext('2d', { alpha: false })
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      await page.render({ canvas, viewport }).promise

      const blob = await new Promise((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('gagal encode JPEG'))),
          'image/jpeg',
          quality,
        ),
      )
      const jpg = await out.embedJpg(await blob.arrayBuffer())
      const newPage = out.addPage([base.width, base.height])
      newPage.drawImage(jpg, { x: 0, y: 0, width: base.width, height: base.height })

      canvas.width = 0 // lepas memori sebelum lanjut
      canvas.height = 0
      page.cleanup()
      onPage?.({ done: i, total })
    }
    return await out.save()
  } finally {
    await doc.destroy()
  }
}
