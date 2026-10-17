import { PDFDocument, degrees } from 'pdf-lib'

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

/**
 * Ambil halaman tertentu dari PDF jadi file baru.
 * @param {ArrayBuffer|Uint8Array} buffer — PDF asli
 * @param {number[]} keepIndices — index halaman (0-based) yang dipertahankan, urutan naik
 */
export async function slicePdf(buffer, keepIndices) {
  const src = await PDFDocument.load(buffer)
  const out = await PDFDocument.create()
  const pages = await out.copyPages(src, keepIndices)
  for (const page of pages) {
    out.addPage(page)
  }
  return out.save()
}

/**
 * Parse range halaman gaya manusia: "1-3, 7, 10-12" → index 0-based.
 * Throw Error dengan pesan ramah kalau format salah / halaman nggak ada.
 */
export function parsePageRange(text, pageCount) {
  const indices = new Set()
  for (const part of text.split(',')) {
    const token = part.trim()
    if (!token) continue
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/)
    if (range) {
      let start = Number(range[1])
      let end = Number(range[2])
      if (start > end) [start, end] = [end, start]
      for (let p = start; p <= end; p++) {
        if (p < 1 || p > pageCount) {
          throw new Error(`Halaman ${p} nggak ada — PDF-nya cuma ${pageCount} halaman.`)
        }
        indices.add(p - 1)
      }
    } else if (/^\d+$/.test(token)) {
      const p = Number(token)
      if (p < 1 || p > pageCount) {
        throw new Error(`Halaman ${p} nggak ada — PDF-nya cuma ${pageCount} halaman.`)
      }
      indices.add(p - 1)
    } else {
      throw new Error(`Format "${token}" belum kenal. Contoh bener: 1-3, 7, 10-12`)
    }
  }
  return [...indices].sort((a, b) => a - b)
}

/**
 * Susun ulang halaman + tambah rotasi.
 * @param {ArrayBuffer|Uint8Array} buffer — PDF asli
 * @param {Array<{ srcIndex: number, rotation: number }>} order — urutan baru; rotation = tambahan derajat (0/90/180/270)
 */
export async function arrangePages(buffer, order) {
  const src = await PDFDocument.load(buffer)
  const out = await PDFDocument.create()
  const copied = await out.copyPages(
    src,
    order.map((o) => o.srcIndex),
  )
  copied.forEach((page, i) => {
    const extra = order[i].rotation ?? 0
    if (extra) {
      const angle = (((page.getRotation().angle + extra) % 360) + 360) % 360
      page.setRotation(degrees(angle))
    }
    out.addPage(page)
  })
  return out.save()
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
