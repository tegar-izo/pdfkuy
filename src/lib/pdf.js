import { PDFDocument } from 'pdf-lib'

/** 1024 → "1 KB" */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Baca & validasi satu file PDF.
 * Balikin { buffer, pageCount }, atau throw kalau bukan PDF valid / kena password.
 */
export async function loadPdfMeta(file) {
  const buffer = await file.arrayBuffer()
  const doc = await PDFDocument.load(buffer)
  return { buffer, pageCount: doc.getPageCount() }
}

/**
 * Gabungkan beberapa PDF jadi satu.
 * @param {Array<{ buffer: ArrayBuffer }>} items — tiap item punya `buffer` hasil loadPdfMeta
 * @returns {Promise<Uint8Array>} bytes PDF hasil gabungan
 */
export async function mergePdfs(items) {
  const merged = await PDFDocument.create()
  for (const item of items) {
    const src = await PDFDocument.load(item.buffer)
    const pages = await merged.copyPages(src, src.getPageIndices())
    for (const page of pages) {
      merged.addPage(page)
    }
  }
  return merged.save()
}

/** Download blob sebagai file di browser. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
